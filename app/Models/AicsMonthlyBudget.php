<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AicsMonthlyBudget extends Model
{
    protected $fillable = ['budget_month', 'total_budget', 'set_by'];

    protected function casts(): array
    {
        return ['total_budget' => 'decimal:2'];
    }
}
