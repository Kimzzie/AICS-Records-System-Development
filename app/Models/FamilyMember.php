<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FamilyMember extends Model
{
    protected $fillable = [
        'transaction_id', 'full_name', 'relationship', 'age',
        'civil_status', 'occupation', 'monthly_salary',
    ];

    protected function casts(): array
    {
        return ['monthly_salary' => 'decimal:2'];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(AicsTransaction::class, 'transaction_id');
    }
}
