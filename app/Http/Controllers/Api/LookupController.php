<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssistanceType;
use App\Models\Barangay;
use App\Models\PartnerAgency;
use App\Models\Signatory;
use App\Models\SystemSetting;

class LookupController extends Controller
{
    public function index()
    {
        return response()->json([
            'agencies' => PartnerAgency::where('status','Active')->orderBy('name')->get(),
            'barangays' => Barangay::where('is_active',true)->orderBy('name')->pluck('name'),
            'assistanceTypes' => AssistanceType::with('requirements')->where('status','Active')->orderBy('name')->get(),
            'signatories' => Signatory::all(),
            'rules' => SystemSetting::all()->mapWithKeys(fn ($s) => [$s->key => $s->value['value'] ?? $s->value]),
        ]);
    }
}
