<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AicsMonthlyBudget;
use App\Models\AicsTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetController extends Controller
{
    public function show(Request $request)
    {
        $month = $request->validate(['month' => ['nullable','date_format:Y-m']])['month'] ?? now()->format('Y-m');
        return response()->json($this->summary($month));
    }

    public function set(Request $request)
    {
        abort_unless($request->user()->role === 'Administrator', 403);
        $data = $request->validate([
            'month' => ['required','date_format:Y-m'],
            'total_budget' => ['required','numeric','min:0','max:999999999999.99'],
        ]);
        $budget = AicsMonthlyBudget::updateOrCreate(
            ['budget_month' => $data['month']],
            ['total_budget' => $data['total_budget'], 'set_by' => $request->user()->id]
        );
        return response()->json(['message' => 'Monthly budget saved.', 'data' => $this->summary($budget->budget_month)]);
    }

    public function issueGuaranteeLetter(Request $request, AicsTransaction $transaction)
    {
        abort_unless(in_array($request->user()->role, ['Administrator','Senior staff'], true), 403);
        return DB::transaction(function () use ($request, $transaction) {
            $locked = AicsTransaction::whereKey($transaction->id)->lockForUpdate()->firstOrFail();
            if ($locked->guarantee_letter_issued_at) {
                return response()->json(['message' => 'This Guarantee Letter has already been issued.'], 409);
            }
            $month = substr((string) $locked->transaction_date, 0, 7);
            $budget = AicsMonthlyBudget::where('budget_month', $month)->lockForUpdate()->first();
            if (!$budget) {
                return response()->json(['message' => 'No monthly budget has been set for ' . $month . '.'], 422);
            }
            $used = (float) AicsTransaction::whereYear('transaction_date', substr($month, 0, 4))
                ->whereMonth('transaction_date', substr($month, 5, 2))
                ->whereNotNull('guarantee_letter_issued_at')->sum('guaranteed_amount');
            $amount = (float) $locked->amount;
            $remaining = (float) $budget->total_budget - $used;
            if ($amount <= 0) {
                return response()->json(['message' => 'The assistance amount must be greater than zero before issuing the Guarantee Letter.'], 422);
            }
            if ($amount > $remaining) {
                return response()->json(['message' => 'Insufficient monthly budget. Remaining balance: ₱' . number_format(max(0, $remaining), 2)], 422);
            }
            $locked->forceFill([
                'guarantee_letter_issued_at' => now(),
                'guaranteed_amount' => $amount,
            ])->save();
            $locked->auditLogs()->create([
                'user_id' => $request->user()->id,
                'action' => 'guarantee_letter_issued',
                'changes' => ['month' => $month, 'amount' => $amount],
            ]);
            return response()->json(['message' => 'Guarantee Letter marked as issued. Budget deducted.', 'data' => $this->summary($month)]);
        });
    }

    private function summary(string $month): array
    {
        $budget = AicsMonthlyBudget::where('budget_month', $month)->first();
        $transactions = AicsTransaction::with(['client'])
            ->whereYear('transaction_date', substr($month, 0, 4))
            ->whereMonth('transaction_date', substr($month, 5, 2))
            ->whereNotNull('guarantee_letter_issued_at')
            ->latest('guarantee_letter_issued_at')->get();
        $used = (float) $transactions->sum('guaranteed_amount');
        $total = (float) ($budget?->total_budget ?? 0);
        return [
            'month' => $month,
            'total_budget' => $total,
            'used' => $used,
            'remaining' => $total - $used,
            'issued_count' => $transactions->count(),
            'transactions' => $transactions->map(fn ($t) => [
                'id' => $t->id, 'gl_number' => $t->gl_number,
                'client' => $t->client?->full_name,
                'date' => $t->transaction_date,
                'amount' => (float) $t->guaranteed_amount,
                'issued_at' => $t->guarantee_letter_issued_at,
            ]),
        ];
    }
}
