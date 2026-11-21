<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionDraft extends Model
{
    protected $fillable = ['user_id', 'client_name', 'beneficiary_name', 'assistance', 'form_data', 'last_saved_at'];

    protected function casts(): array
    {
        return ['form_data' => 'array', 'last_saved_at' => 'datetime'];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
