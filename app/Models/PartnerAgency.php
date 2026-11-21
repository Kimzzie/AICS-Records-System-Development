<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerAgency extends Model
{
    protected $fillable = ['name', 'address', 'contact', 'status'];

    public function transactions(): HasMany
    {
        return $this->hasMany(AicsTransaction::class, 'partner_agency_id');
    }
}
