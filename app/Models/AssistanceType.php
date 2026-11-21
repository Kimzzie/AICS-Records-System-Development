<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class AssistanceType extends Model
{
    protected $fillable = ['name', 'copies', 'status'];

    public function requirements(): HasMany
    {
        return $this->hasMany(AssistanceRequirement::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AicsTransaction::class);
    }
}
