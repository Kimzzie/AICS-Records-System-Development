<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionAuditLog extends Model
{
    protected $fillable = ['transaction_id', 'user_id', 'action', 'changes'];

    protected function casts(): array { return ['changes' => 'array']; }

    public function transaction(): BelongsTo { return $this->belongsTo(AicsTransaction::class, 'transaction_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
