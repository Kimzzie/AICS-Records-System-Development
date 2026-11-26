<?php

namespace App\Services;

use App\Models\AicsTransaction;
use App\Models\SystemSetting;
use Carbon\Carbon;

class ViewerAssistanceVerificationService
{
    public function verify(string $name, string $birthdate): array
    {
        $normalizedName = $this->normalizePersonName($name);

        $records = $this->matchingTransactions($normalizedName, $birthdate)
            ->select([
                'id',
                'transaction_date',
                'assistance_type_id',
                'assistance_provided',
            ])
            ->with('assistanceType:id,name')
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn (AicsTransaction $transaction) => [
                'transaction_date' => $transaction->transaction_date?->toDateString(),
                'assistance_type' => $transaction->assistanceType?->name
                    ?: $transaction->assistance_provided,
            ])
            ->values()
            ->all();

        if ($records !== []) {
            $setting = SystemSetting::where('key', 'waitingPeriodMonths')->first();
            $waitingMonths = $setting ? (int) ($setting->value['value'] ?? 3) : 3;

            $latestDate = $records[0]['transaction_date'];
            $nextEligibleDate = $waitingMonths > 0
                ? Carbon::parse($latestDate)->addMonths($waitingMonths)->toDateString()
                : null;

            $today = Carbon::today();
            $isEligibleNow = $nextEligibleDate === null
                || Carbon::parse($nextEligibleDate)->lte($today);
            $daysUntilEligible = $isEligibleNow
                ? 0
                : (int) $today->diffInDays(Carbon::parse($nextEligibleDate));

            return [
                'match_status' => 'confirmed_match',
                'records' => $records,
                'waiting_period_months' => $waitingMonths,
                'latest_transaction_date' => $latestDate,
                'next_eligible_date' => $nextEligibleDate,
                'is_eligible_now' => $isEligibleNow,
                'days_until_eligible' => $daysUntilEligible,
            ];
        }

        $matchStatus = $this->matchingTransactions($normalizedName)->exists()
            ? 'possible_match'
            : 'no_match';

        return [
            'match_status' => $matchStatus,
            'records' => [],
        ];
    }

    private function matchingTransactions(string $normalizedName, ?string $birthdate = null)
    {
        return AicsTransaction::query()
            ->where(function ($query) use ($normalizedName, $birthdate) {
                $matchesPerson = function ($personQuery) use ($normalizedName, $birthdate) {
                    $personQuery->whereRaw(
                        "REGEXP_REPLACE(LOWER(TRIM(full_name)), '[[:space:][:punct:]]+', '') LIKE ?",
                        ['%' . $normalizedName . '%']
                    );

                    if ($birthdate !== null) {
                        $personQuery->whereDate('birthdate', $birthdate);
                    }
                };

                $query->whereHas('client', $matchesPerson)
                    ->orWhereHas('beneficiary', $matchesPerson);
            });
    }

    private function normalizePersonName(string $name): string
    {
        return preg_replace('/[\s\p{P}]+/u', '', mb_strtolower(trim($name))) ?? '';
    }
}
