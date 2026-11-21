<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Beneficiary extends Model
{
    protected $fillable = [
        'last_name', 'first_name', 'middle_name', 'extension', 'full_name',
        'street', 'barangay', 'city', 'province', 'region', 'mobile',
        'birthdate', 'gender', 'civil_status', 'occupation', 'monthly_salary',
        'relationship_to_client',
    ];

    protected function casts(): array
    {
        return ['birthdate' => 'date', 'monthly_salary' => 'decimal:2'];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AicsTransaction::class);
    }
}
