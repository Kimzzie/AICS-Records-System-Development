<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AicsTransaction extends Model
{
    protected $table = 'aics_transactions';

    protected $fillable = [
        'gl_number', 'transaction_date', 'client_id', 'beneficiary_id',
        'client_type', 'source', 'target_sector', 'sub_category',
        'assistance_type_id', 'assistance_provided', 'amount', 'amount_words',
        'fund_source', 'purpose', 'partner_agency_id', 'contact_person',
        'contact_number', 'valid_until', 'case_summary', 'worker_name',
        'created_by', 'status', 'metadata', 'guarantee_letter_issued_at', 'guaranteed_amount',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'valid_until' => 'date',
            'amount' => 'decimal:2',
            'guarantee_letter_issued_at' => 'datetime',
            'guaranteed_amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function client(): BelongsTo { return $this->belongsTo(Client::class); }
    public function beneficiary(): BelongsTo { return $this->belongsTo(Beneficiary::class); }
    public function assistanceType(): BelongsTo { return $this->belongsTo(AssistanceType::class); }
    public function partnerAgency(): BelongsTo { return $this->belongsTo(PartnerAgency::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function familyMembers(): HasMany { return $this->hasMany(FamilyMember::class, 'transaction_id'); }
    public function auditLogs(): HasMany { return $this->hasMany(TransactionAuditLog::class, 'transaction_id'); }
}
