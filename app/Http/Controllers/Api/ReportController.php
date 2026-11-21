<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AicsTransaction;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function monthly(Request $request)
    {
        $data = $request->validate(['month' => ['required','date_format:Y-m'],'agency_id' => ['nullable','integer']]);
        $query = AicsTransaction::with(['client','beneficiary','partnerAgency','assistanceType'])
            ->whereYear('transaction_date',substr($data['month'],0,4))
            ->whereMonth('transaction_date',substr($data['month'],5,2));
        if (!empty($data['agency_id'])) $query->where('partner_agency_id',$data['agency_id']);
        $records = $query->orderBy('partner_agency_id')->orderBy('transaction_date')->get();
        return response()->json([
            'month' => $data['month'],'records' => $records,
            'totals' => ['count' => $records->count(),'amount' => $records->sum('amount'),'missing_partner_agency' => $records->whereNull('partner_agency_id')->count()],
            'by_agency' => $records->groupBy(fn($r) => $r->partnerAgency?->name ?? 'Missing partner agency')
                ->map(fn($items,$name) => ['agency' => $name,'count' => $items->count(),'amount' => $items->sum('amount')])->values(),
        ]);
    }
}
