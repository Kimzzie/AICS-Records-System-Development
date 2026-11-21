<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssistanceType;
use App\Models\AssistanceRequirement;
use App\Models\Barangay;
use App\Models\PartnerAgency;
use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function users() { return User::select('id','name','username','role','status','must_change_password','last_login_at')->orderBy('name')->get(); }

    public function createUser(Request $request)
    {
        $data=$request->validate(['name'=>['required','string','max:255'],'username'=>['required','string','max:100','alpha_dash','unique:users,username'],'password'=>['required','string','min:10'],'role'=>['required',Rule::in(['Viewer','Staff','Senior staff','Administrator'])]]);
        $user=User::create($data+['status'=>'Active','must_change_password'=>true]);
        return response()->json(['data'=>$user->only('id','name','username','role','status')],201);
    }

    public function updateUser(Request $request, User $user)
    {
        $data=$request->validate(['name'=>['sometimes','string','max:255'],'role'=>['sometimes',Rule::in(['Viewer','Staff','Senior staff','Administrator'])],'status'=>['sometimes',Rule::in(['Active','Disabled'])],'password'=>['sometimes','string','min:10']]);
        if(($data['status']??null)==='Disabled' && $user->role==='Administrator' && User::where('role','Administrator')->where('status','Active')->count()<=1) return response()->json(['message'=>'The last active administrator cannot be disabled.'],422);
        $user->fill($data)->save();
        return response()->json(['data'=>$user->only('id','name','username','role','status')]);
    }

    public function agencies() { return PartnerAgency::withCount('transactions')->orderBy('name')->get(); }

    public function createAgency(Request $request)
    {
        $data=$request->validate(['name'=>['required','string','max:255','unique:partner_agencies,name'],'address'=>['nullable','string','max:255'],'contact'=>['nullable','string','max:50']]);
        return response()->json(['data'=>PartnerAgency::create($data+['status'=>'Active'])],201);
    }

    public function updateAgency(Request $request, PartnerAgency $agency)
    {
        $data=$request->validate(['name'=>['sometimes','string','max:255',Rule::unique('partner_agencies','name')->ignore($agency->id)],'address'=>['nullable','string','max:255'],'contact'=>['nullable','string','max:50'],'status'=>['sometimes',Rule::in(['Active','Disabled'])]]);
        $agency->update($data); return response()->json(['data'=>$agency]);
    }

    public function deleteAgency(PartnerAgency $agency)
    {
        if($agency->transactions()->exists()) return response()->json(['message'=>'This agency is already used by a saved record and cannot be deleted.'],422);
        $agency->delete(); return response()->json(['message'=>'Agency deleted.']);
    }

    public function createBarangay(Request $request)
    {
        $data=$request->validate(['name'=>['required','string','max:150','unique:barangays,name']]);
        return response()->json(['data'=>Barangay::create($data)],201);
    }

    public function deleteBarangay(Barangay $barangay)
    {
        $barangay->delete(); return response()->json(['message'=>'Barangay removed.']);
    }

    public function createAssistanceType(Request $request)
    {
        $data=$request->validate(['name'=>['required','string','max:100','unique:assistance_types,name'],'copies'=>['nullable','string','max:100'],'requirements'=>['array'],'requirements.*'=>['required','string','max:255']]);
        $type=AssistanceType::create(['name'=>$data['name'],'copies'=>$data['copies']??null,'status'=>'Active']);
        foreach($data['requirements']??[] as $i=>$requirement) $type->requirements()->create(['requirement'=>$requirement,'sort_order'=>$i+1]);
        return response()->json(['data'=>$type->load('requirements')],201);
    }

    public function updateAssistanceType(Request $request, AssistanceType $assistanceType)
    {
        $data=$request->validate(['name'=>['sometimes','string','max:100',Rule::unique('assistance_types','name')->ignore($assistanceType->id)],'copies'=>['nullable','string','max:100'],'status'=>['sometimes',Rule::in(['Active','Disabled'])],'requirements'=>['sometimes','array'],'requirements.*'=>['required','string','max:255']]);
        $assistanceType->update($data);
        if(array_key_exists('requirements',$data)){ $assistanceType->requirements()->delete(); foreach($data['requirements'] as $i=>$requirement) $assistanceType->requirements()->create(['requirement'=>$requirement,'sort_order'=>$i+1]); }
        return response()->json(['data'=>$assistanceType->load('requirements')]);
    }

    public function updateSignatory(Request $request, Signatory $signatory)
    {
        $signatory->update($request->validate(['name'=>['required','string','max:255'],'title'=>['nullable','string','max:255']]));
        return response()->json(['data'=>$signatory]);
    }

    public function updateSettings(Request $request)
    {
        $data=$request->validate(['waitingPeriodMonths'=>['sometimes','integer','min:0','max:24'],'glValidityDays'=>['sometimes','integer','min:1','max:365'],'logoutTimeoutMinutes'=>['sometimes','integer','min:1','max:1440'],'keepDraftsDays'=>['sometimes','integer','min:1','max:365']]);
        foreach($data as $key=>$value) SystemSetting::updateOrCreate(['key'=>$key],['value'=>['value'=>$value]]);
        return response()->json(['message'=>'Settings saved.','data'=>$data]);
    }
}
