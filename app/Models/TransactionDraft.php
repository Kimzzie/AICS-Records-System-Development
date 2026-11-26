<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionDraft extends Model
{
    use Prunable;

    protected $fillable = ['user_id', 'client_name', 'beneficiary_name', 'assistance', 'form_data', 'last_saved_at'];

    protected function casts(): array
    {
        return ['form_data' => 'array', 'last_saved_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Resolve draft expiry from the current Admin setting, falling back to 30 days.
     * A null last_saved_at is supported for older rows by using updated_at.
     */
    public function prunable(): Builder
    {
        $setting = SystemSetting::query()->where('key', 'keepDraftsDays')->first();
        $value = $setting?->value;
        $retentionDays = max(1, min(365, (int) (is_array($value) ? ($value['value'] ?? 30) : ($value ?? 30))));
        $cutoff = now()->subDays($retentionDays);

        return static::query()->where(function (Builder $query) use ($cutoff) {
            $query->where(function (Builder $savedQuery) use ($cutoff) {
                $savedQuery->whereNotNull('last_saved_at')
                    ->where('last_saved_at', '<', $cutoff);
            })->orWhere(function (Builder $legacyQuery) use ($cutoff) {
                $legacyQuery->whereNull('last_saved_at')
                    ->where('updated_at', '<', $cutoff);
            });
        });
    }

    /**
     * Opportunistic cleanup keeps the API expiry rule effective even when the
     * host's Laravel scheduler has not yet run.
     */
    public static function pruneExpired(): int
    {
        return (new static())->prunable()->delete();
    }
}
