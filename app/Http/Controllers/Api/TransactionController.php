<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AicsTransaction;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\PartnerAgency;
use App\Models\TransactionDraft;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = AicsTransaction::with(['client','beneficiary','assistanceType','partnerAgency','familyMembers'])->latest('transaction_date');
        if ($request->filled('year')) $query->whereYear('transaction_date', $request->integer('year'));
        return $query->paginate(min($request->integer('per_page', 20), 100));
    }

    public function search(Request $request)
    {
        $data = $request->validate(['q' => ['required','string','min:3','max:150']]);
        $term = $data['q'];
        $rows = AicsTransaction::with(['client','beneficiary','assistanceType','partnerAgency'])
            ->whereHas('client', fn($q) => $q->where('full_name','like',"%{$term}%"))
            ->orWhereHas('beneficiary', fn($q) => $q->where('full_name','like',"%{$term}%"))
            ->latest('transaction_date')->limit(50)->get();
        return response()->json(['data' => $rows]);
    }

    public function checkBeneficiaryEligibility(Request $request)
    {
        $data = $request->validate(['name' => ['required','string','min:2','max:255']]);
        $name = mb_strtolower(trim($data['name']));

        $matches = AicsTransaction::with(['client','beneficiary','assistanceType'])
            ->where(function ($query) use ($name) {
                $query->whereHas('client', fn($q) => $q->whereRaw('LOWER(TRIM(full_name)) = ?', [$name]))
                    ->orWhereHas('beneficiary', fn($q) => $q->whereRaw('LOWER(TRIM(full_name)) = ?', [$name]));
            })
            ->latest('transaction_date')
            ->limit(10)
            ->get();

        return response()->json([
            'eligible' => $matches->isEmpty(),
            'matches' => $matches->map(fn($record) => [
                'gl_number' => $record->gl_number,
                'transaction_date' => $record->transaction_date,
                'client_name' => $record->client?->full_name,
                'beneficiary_name' => $record->beneficiary?->full_name,
                'assistance_type' => $record->assistanceType?->name ?? $record->assistance_provided,
            ])->values(),
            'message' => $matches->isEmpty()
                ? 'No previous record found for this beneficiary.'
                : 'This beneficiary already appears in previous AICS records and is not eligible.',
        ]);
    }

    public function show(AicsTransaction $transaction)
    {
        return $transaction->load(['client','beneficiary','familyMembers','assistanceType.requirements','partnerAgency','creator','auditLogs.user']);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);

        // A person already recorded as a client or beneficiary cannot be newly
        // nominated as a beneficiary again. Compare normalized full names.
        $beneficiaryName = mb_strtolower(trim($data['beneficiary']['full_name']));
        $alreadyRecordedAsClient = Client::query()
            ->whereRaw('LOWER(TRIM(full_name)) = ?', [$beneficiaryName])
            ->exists();
        $alreadyRecordedAsBeneficiary = Beneficiary::query()
            ->whereRaw('LOWER(TRIM(full_name)) = ?', [$beneficiaryName])
            ->exists();

        if ($alreadyRecordedAsClient || $alreadyRecordedAsBeneficiary) {
            return response()->json([
                'message' => 'This person is already listed in AICS records and cannot be registered as a beneficiary. Please verify the beneficiary information and choose an eligible person.',
                'errors' => [
                    'beneficiary.full_name' => ['This name already exists in the client or beneficiary records.'],
                ],
            ], 422);
        }

        $record = DB::transaction(function () use ($data, $request) {
            $client = Client::create($data['client']);
            $beneficiary = Beneficiary::create($data['beneficiary']);
            $agency = isset($data['partner_agency_name']) ? PartnerAgency::where('name',$data['partner_agency_name'])->first() : null;
            $year = now()->year;
            $last = AicsTransaction::whereYear('transaction_date',$year)->lockForUpdate()->orderByDesc('id')->value('gl_number');
            $number = $last ? ((int) explode('-', $last)[0] + 1) : 1;
            $record = AicsTransaction::create([
                'gl_number' => str_pad((string)$number,4,'0',STR_PAD_LEFT).'-'.$year,
                'transaction_date' => $data['transaction_date'],
                'client_id' => $client->id, 'beneficiary_id' => $beneficiary->id,
                'client_type' => $data['client_type'] ?? 'New', 'source' => $data['source'] ?? 'Walk-in',
                'target_sector' => $data['target_sector'] ?? null, 'sub_category' => $data['sub_category'] ?? null,
                'assistance_type_id' => $data['assistance_type_id'] ?? null,
                'assistance_provided' => $data['assistance_provided'] ?? null,
                'amount' => $data['amount'] ?? 0, 'amount_words' => $data['amount_words'] ?? null,
                'fund_source' => $data['fund_source'] ?? null, 'purpose' => $data['purpose'] ?? null,
                'partner_agency_id' => $agency?->id, 'contact_person' => $data['contact_person'] ?? null,
                'contact_number' => $data['contact_number'] ?? null, 'valid_until' => $data['valid_until'] ?? null,
                'case_summary' => $data['case_summary'] ?? null, 'worker_name' => $request->user()->name,
                'created_by' => $request->user()->id, 'metadata' => $data['metadata'] ?? null,
            ]);
            foreach ($data['family_members'] ?? [] as $member) $record->familyMembers()->create($member);
            $record->auditLogs()->create(['user_id' => $request->user()->id,'action' => 'created','changes' => ['gl_number' => $record->gl_number]]);
            return $record;
        });
        return response()->json(['message' => 'Transaction saved.','data' => $record->load(['client','beneficiary','familyMembers','assistanceType','partnerAgency'])],201);
    }

    public function update(Request $request, AicsTransaction $transaction)
    {
        $data = $this->validatePayload($request, false);
        DB::transaction(function () use ($data,$request,$transaction) {
            $before = $transaction->only(['amount','purpose','partner_agency_id','case_summary']);
            if (isset($data['client'])) $transaction->client->update($data['client']);
            if (isset($data['beneficiary'])) $transaction->beneficiary->update($data['beneficiary']);
            $agency = array_key_exists('partner_agency_name',$data) ? PartnerAgency::where('name',$data['partner_agency_name'])->first() : $transaction->partnerAgency;
            $transaction->fill([
                'target_sector' => $data['target_sector'] ?? $transaction->target_sector,
                'sub_category' => $data['sub_category'] ?? $transaction->sub_category,
                'assistance_type_id' => $data['assistance_type_id'] ?? $transaction->assistance_type_id,
                'assistance_provided' => $data['assistance_provided'] ?? $transaction->assistance_provided,
                'amount' => $data['amount'] ?? $transaction->amount,
                'amount_words' => $data['amount_words'] ?? $transaction->amount_words,
                'fund_source' => $data['fund_source'] ?? $transaction->fund_source,
                'purpose' => $data['purpose'] ?? $transaction->purpose,
                'partner_agency_id' => $agency?->id,
                'contact_person' => $data['contact_person'] ?? $transaction->contact_person,
                'contact_number' => $data['contact_number'] ?? $transaction->contact_number,
                'case_summary' => $data['case_summary'] ?? $transaction->case_summary,
            ])->save();
            if (isset($data['family_members'])) {
                $transaction->familyMembers()->delete();
                foreach ($data['family_members'] as $member) $transaction->familyMembers()->create($member);
            }
            $transaction->auditLogs()->create(['user_id' => $request->user()->id,'action' => 'updated','changes' => ['before' => $before,'after' => $transaction->only(array_keys($before))]]);
        });
        return response()->json(['message' => 'Record updated.','data' => $transaction->fresh()->load(['client','beneficiary','familyMembers','partnerAgency','assistanceType'])]);
    }

    public function destroy(Request $request, AicsTransaction $transaction)
    {
        $transaction->auditLogs()->create(['user_id' => $request->user()->id,'action' => 'deleted']);
        $transaction->delete();
        return response()->json(['message' => 'Record deleted.']);
    }

    public function drafts(Request $request) { return $request->user()->transactionDrafts()->latest()->get(); }

    public function saveDraft(Request $request)
    {
        $data = $request->validate([
            'id' => ['nullable','integer'], 'client_name' => ['nullable','string','max:255'],
            'beneficiary_name' => ['nullable','string','max:255'], 'assistance' => ['nullable','string','max:100'],
            'form_data' => ['required','array'],
        ]);
        $draft = isset($data['id']) ? $request->user()->transactionDrafts()->findOrFail($data['id']) : new TransactionDraft(['user_id' => $request->user()->id]);
        $draft->fill(['client_name' => $data['client_name'] ?? null,'beneficiary_name' => $data['beneficiary_name'] ?? null,'assistance' => $data['assistance'] ?? null,'form_data' => $data['form_data'],'last_saved_at' => now()])->save();
        return response()->json(['data' => $draft],201);
    }

    public function deleteDraft(Request $request, TransactionDraft $draft)
    {
        abort_unless($draft->user_id === $request->user()->id || $request->user()->role === 'Administrator',403);
        $draft->delete();
        return response()->json(['message' => 'Draft deleted.']);
    }

    private function validatePayload(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'transaction_date' => [$creating ? 'required' : 'sometimes','date'],
            'client' => [$creating ? 'required' : 'sometimes','array'],
            'client.last_name' => ['required_with:client','string','max:100'],
            'client.first_name' => ['required_with:client','string','max:100'],
            'client.full_name' => ['required_with:client','string','max:255'],
            'client.*' => ['nullable'],
            'beneficiary' => [$creating ? 'required' : 'sometimes','array'],
            'beneficiary.last_name' => ['required_with:beneficiary','string','max:100'],
            'beneficiary.first_name' => ['required_with:beneficiary','string','max:100'],
            'beneficiary.full_name' => ['required_with:beneficiary','string','max:255'],
            'beneficiary.*' => ['nullable'],
            'client_type' => ['nullable','in:New,Returning'],'source' => ['nullable','in:Walk-in,Referral'],
            'target_sector' => ['nullable','string','max:100'],'sub_category' => ['nullable','string','max:255'],
            'assistance_type_id' => ['nullable','integer','exists:assistance_types,id'],
            'assistance_provided' => ['nullable','string','max:255'],'amount' => ['nullable','numeric','min:0'],
            'amount_words' => ['nullable','string','max:255'],'fund_source' => ['nullable','string','max:150'],
            'purpose' => ['nullable','string','max:255'],'partner_agency_name' => ['nullable','string','max:255'],
            'contact_person' => ['nullable','string','max:150'],'contact_number' => ['nullable','string','max:50'],
            'valid_until' => ['nullable','date'],'case_summary' => ['nullable','string','max:600'],
            'family_members' => ['nullable','array'],'family_members.*.full_name' => ['required','string','max:255'],
            'family_members.*.relationship' => ['nullable','string','max:100'],'family_members.*.age' => ['nullable','integer','min:0','max:130'],
            'family_members.*.civil_status' => ['nullable','string','max:50'],'family_members.*.occupation' => ['nullable','string','max:150'],
            'family_members.*.monthly_salary' => ['nullable','numeric','min:0'],'metadata' => ['nullable','array'],
        ]);
    }
}
