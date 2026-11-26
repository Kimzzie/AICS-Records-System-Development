<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AicsTransaction;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\PartnerAgency;
use App\Models\TransactionDraft;
use App\Models\SystemSetting;
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
        $rows = AicsTransaction::with(['client','beneficiary','assistanceType','partnerAgency','familyMembers'])
            ->whereHas('client', fn($q) => $q->where('full_name','like',"%{$term}%"))
            ->orWhereHas('beneficiary', fn($q) => $q->where('full_name','like',"%{$term}%"))
            ->latest('transaction_date')->limit(50)->get();
        return response()->json(['data' => $rows]);
    }

    public function checkBeneficiaryEligibility(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','min:2','max:255'],
            'birthdate' => ['sometimes','nullable','date'],
        ]);
        $name = trim($data['name']);
        $waitingPeriodMonths = $this->waitingPeriodMonths();
        $birthdate = $data['birthdate'] ?? null;
        $nameMatchesQuery = $this->personHistoryQuery($name);
        $nameMatchCount = (clone $nameMatchesQuery)->count();
        $matches = $nameMatchesQuery->latest('transaction_date')->latest('id')->limit(10)->get();
        $exactMatchExists = $birthdate !== null && $this->personHistoryQuery($name, $birthdate)->exists();
        $recentExactMatchExists = $birthdate !== null && $this->personHistoryQuery($name, $birthdate, true)->exists();

        $identityStatus = match (true) {
            $birthdate === null && $nameMatchCount > 0 => 'verification_required',
            $birthdate !== null && $exactMatchExists => 'confirmed_match',
            $birthdate !== null && $nameMatchCount > 0 => 'possible_name_match',
            default => 'no_match',
        };
        $eligible = ! $recentExactMatchExists;
        $message = match (true) {
            $recentExactMatchExists => "This person has an AICS record within the last {$waitingPeriodMonths} month(s) and is not yet eligible.",
            $identityStatus === 'confirmed_match' => 'A previous record for this person was found, but the configured waiting period has elapsed. The person is eligible.',
            $identityStatus === 'verification_required' => 'A record with the same name was found. Date of birth is needed to verify identity; a name match alone does not block assistance.',
            $identityStatus === 'possible_name_match' => 'A record with the same name but a different date of birth was found. Verify the person if needed; this name match alone does not block assistance.',
            default => 'No previous record found for this person.',
        };

        return response()->json([
            'eligible' => $eligible,
            'identity_status' => $identityStatus,
            'history_total' => $nameMatchCount,
            'history_per_page' => 10,
            'has_more_history' => $nameMatchCount > 10,
            'waiting_period_months' => $waitingPeriodMonths,
            'matches' => $matches->map(fn($record) => [
                'gl_number' => $record->gl_number,
                'transaction_date' => $record->transaction_date,
                'client_name' => $record->client?->full_name,
                'beneficiary_name' => $record->beneficiary?->full_name,
                'assistance_type' => $record->assistanceType?->name ?? $record->assistance_provided,
            ])->values(),
            'message' => $message,
        ]);
    }
    public function beneficiaryHistory(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $records = $this->personHistoryQuery(trim($data['name']))
            ->latest('transaction_date')->latest('id')
            ->paginate($request->integer('per_page', 10));

        return response()->json([
            'data' => $records->getCollection()->map(fn($record) => [
                'id' => $record->id,
                'gl_number' => $record->gl_number,
                'transaction_date' => $record->transaction_date,
                'client_name' => $record->client?->full_name,
                'beneficiary_name' => $record->beneficiary?->full_name,
                'assistance_type' => $record->assistanceType?->name ?? $record->assistance_provided,
            ])->values(),
            'pagination' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function show(AicsTransaction $transaction)
    {
        return $transaction->load(['client','beneficiary','familyMembers','assistanceType.requirements','partnerAgency','creator','auditLogs.user']);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);

        if (! empty($data['draft_id'])) {
            TransactionDraft::pruneExpired();

            // Fail cross-owner or expired draft IDs before eligibility checks so
            // draft privacy does not depend on unrelated client-history results.
            $request->user()->transactionDrafts()
                ->whereKey($data['draft_id'])
                ->firstOrFail();
        }

        // Apply the same configurable waiting-period rule used by the eligibility check.
        // A historical match outside the waiting period remains visible in history but
        // does not permanently prevent the person from receiving assistance again.
        $waitingPeriodMonths = $this->waitingPeriodMonths();
        $blockingErrors = [];
        $identityWarnings = [];
        foreach (['client', 'beneficiary'] as $role) {
            $person = $data[$role];
            $name = trim($person['full_name']);
            $birthdate = $person['birthdate'] ?? null;
            $nameMatches = $this->personHistoryQuery($name)->latest('transaction_date')->latest('id')->limit(10)->get();
            $exactMatches = $birthdate !== null ? $this->personHistoryQuery($name, $birthdate)->latest('transaction_date')->latest('id')->limit(10)->get() : collect();
            $recentExactMatches = $birthdate !== null ? $this->personHistoryQuery($name, $birthdate, true)->latest('transaction_date')->latest('id')->limit(10)->get() : collect();
            if ($recentExactMatches->isNotEmpty()) {
                $blockingErrors[$role.'.full_name'] = ["This person has an AICS record within the last {$waitingPeriodMonths} month(s) and is not yet eligible."];
                continue;
            }
            if ($nameMatches->isNotEmpty() && ($birthdate === null || $exactMatches->isEmpty())) {
                $identityWarnings[] = [
                    'role' => $role,
                    'name' => $name,
                    'status' => $birthdate === null ? 'verification_required' : 'possible_name_match',
                    'message' => 'A historical record with the same name was found, but identity was not confirmed by date of birth. Verify the possible match before proceeding.',
                    'matches' => $nameMatches->map(fn($record) => [
                        'gl_number' => $record->gl_number,
                        'transaction_date' => $record->transaction_date,
                        'client_name' => $record->client?->full_name,
                        'beneficiary_name' => $record->beneficiary?->full_name,
                        'assistance_type' => $record->assistanceType?->name ?? $record->assistance_provided,
                    ])->values(),
                ];
            }
        }

        if ($blockingErrors !== []) {
            return response()->json([
                'message' => "The configured AICS waiting period of {$waitingPeriodMonths} month(s) has not elapsed for a verified person.",
                'errors' => $blockingErrors,
                'identity_warnings' => $identityWarnings,
            ], 422);
        }
        $record = DB::transaction(function () use ($data, $request) {
            $draft = null;
            if (! empty($data['draft_id'])) {
                $draft = $request->user()->transactionDrafts()
                    ->lockForUpdate()
                    ->find($data['draft_id']);

                abort_unless($draft, 404);
            }

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

            // Consume the exact creator-owned draft in the same transaction as
            // the official AICS record; never match or delete by person name.
            $draft?->delete();

            return $record;
        });
        return response()->json(['message' => 'Transaction saved.','data' => $record->load(['client','beneficiary','familyMembers','assistanceType','partnerAgency']),'identity_warnings' => $identityWarnings],201);
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

    public function drafts(Request $request)
    {
        TransactionDraft::pruneExpired();

        $drafts = $request->user()->transactionDrafts()
            ->select(['id', 'client_name', 'beneficiary_name', 'assistance', 'last_saved_at', 'created_at', 'updated_at'])
            ->orderByDesc('last_saved_at')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $drafts]);
    }

    public function showDraft(Request $request, TransactionDraft $draft)
    {
        TransactionDraft::pruneExpired();

        return response()->json(['data' => $this->ownedDraft($request, $draft)]);
    }

    public function saveDraft(Request $request)
    {
        TransactionDraft::pruneExpired();
        $data = $this->validateDraftPayload($request);

        $draft = $request->user()->transactionDrafts()->create([
            'client_name' => $data['client_name'] ?? null,
            'beneficiary_name' => $data['beneficiary_name'] ?? null,
            'assistance' => $data['assistance'] ?? null,
            'form_data' => $data['form_data'],
            'last_saved_at' => now(),
        ]);

        return response()->json(['data' => $draft], 201);
    }

    public function updateDraft(Request $request, TransactionDraft $draft)
    {
        TransactionDraft::pruneExpired();
        $draft = $this->ownedDraft($request, $draft);
        $data = $this->validateDraftPayload($request);

        $draft->fill([
            'client_name' => $data['client_name'] ?? null,
            'beneficiary_name' => $data['beneficiary_name'] ?? null,
            'assistance' => $data['assistance'] ?? null,
            'form_data' => $data['form_data'],
            'last_saved_at' => now(),
        ])->save();

        return response()->json(['data' => $draft->fresh()]);
    }

    public function deleteDraft(Request $request, TransactionDraft $draft)
    {
        TransactionDraft::pruneExpired();
        $this->ownedDraft($request, $draft)->delete();

        return response()->json(['message' => 'Draft deleted.']);
    }

    private function validateDraftPayload(Request $request): array
    {
        return $request->validate([
            'client_name' => ['nullable', 'string', 'max:255'],
            'beneficiary_name' => ['nullable', 'string', 'max:255'],
            'assistance' => ['nullable', 'string', 'max:100'],
            'form_data' => ['required', 'array'],
            'form_data.schema_version' => ['required', 'integer', 'in:1'],
            'form_data.transaction' => ['required', 'array'],
            'form_data.fields' => ['required', 'array'],
            'form_data.groups' => ['sometimes', 'array'],
            'form_data.step1' => ['sometimes', 'array'],
        ]);
    }

    private function ownedDraft(Request $request, TransactionDraft $draft): TransactionDraft
    {
        return $request->user()->transactionDrafts()->whereKey($draft->getKey())->firstOrFail();
    }

    private function waitingPeriodMonths(): int
    {
        $setting = SystemSetting::query()->where('key', 'waitingPeriodMonths')->first();
        $value = $setting?->value;

        return max(0, (int) (is_array($value) ? ($value['value'] ?? 3) : ($value ?? 3)));
    }

    private function normalizePersonName(string $name): string
    {
        return preg_replace('/[\s\p{P}]+/u', '', mb_strtolower(trim($name))) ?? '';
    }

    private function personHistoryQuery(string $name, ?string $birthdate = null, bool $withinWaitingPeriod = false)
    {
        $normalizedName = $this->normalizePersonName($name);
        $query = AicsTransaction::with(['client', 'beneficiary', 'assistanceType'])
            ->where(function ($query) use ($normalizedName, $birthdate) {
                $matchesPerson = function ($personQuery) use ($normalizedName, $birthdate) {
                    $personQuery->whereRaw(
                        "REGEXP_REPLACE(LOWER(TRIM(full_name)), '[[:space:][:punct:]]+', '') = ?",
                        [$normalizedName]
                    );

                    if ($birthdate !== null) {
                        $personQuery->whereDate('birthdate', $birthdate);
                    }
                };

                $query->whereHas('client', $matchesPerson)
                    ->orWhereHas('beneficiary', $matchesPerson);
            });

        if ($withinWaitingPeriod) {
            $months = $this->waitingPeriodMonths();
            if ($months === 0) {
                $query->whereRaw('1 = 0');
            } else {
                $cutoff = now()->subMonthsNoOverflow($months)->toDateString();
                $query->whereDate('transaction_date', '>', $cutoff);
            }
        }

        return $query;
    }

    private function validatePayload(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'transaction_date' => [$creating ? 'required' : 'sometimes','date'],
            'draft_id' => [$creating ? 'sometimes' : 'prohibited', 'nullable', 'integer', 'min:1'],
            'client' => [$creating ? 'required' : 'sometimes','array'],
            'client.last_name' => ['required_with:client','string','max:100'],
            'client.first_name' => ['required_with:client','string','max:100'],
            'client.full_name' => ['required_with:client','string','max:255'],
            'client.birthdate' => ['nullable','date'],
            'client.salary' => ['nullable','integer','min:0'],
            'client.*' => ['nullable'],
            'beneficiary' => [$creating ? 'required' : 'sometimes','array'],
            'beneficiary.last_name' => ['required_with:beneficiary','string','max:100'],
            'beneficiary.first_name' => ['required_with:beneficiary','string','max:100'],
            'beneficiary.full_name' => ['required_with:beneficiary','string','max:255'],
            'beneficiary.birthdate' => ['nullable','date'],
            'beneficiary.salary' => ['nullable','integer','min:0'],
            'beneficiary.*' => ['nullable'],
            'client_type' => ['nullable','in:New,Returning'],'source' => ['nullable','in:Walk-in,Referral'],
            'target_sector' => ['nullable','string','max:100'],'sub_category' => ['nullable','string','max:255'],
            'assistance_type_id' => ['nullable','integer','exists:assistance_types,id'],
            'assistance_provided' => ['nullable','string','max:255'],'amount' => ['nullable','numeric','min:0','max:2000'],
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
