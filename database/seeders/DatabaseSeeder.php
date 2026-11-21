<?php

namespace Database\Seeders;

use App\Models\AssistanceRequirement;
use App\Models\AssistanceType;
use App\Models\Barangay;
use App\Models\PartnerAgency;
use App\Models\Signatory;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['Ana Dela Cruz','staff','Staff'],
            ['Liza Ramos','sstaff','Senior staff'],
            ['Maria Theresa S. Aleria','admin','Administrator'],
            ['Auditor Personnel','viewer','Viewer'],
        ] as [$name,$username,$role]) {
            $user = User::firstOrCreate(['username' => $username],[
                'name' => $name,'password' => bcrypt((string) env('AICS_SEED_PASSWORD',bin2hex(random_bytes(18)))),
                'role' => $role,'status' => 'Active','must_change_password' => false,
            ]);

            // Optional one-time credential bootstrap: set AICS_SEED_PASSWORD in the
            // deployment environment for one deployment, then remove it immediately.
            // Without this variable, existing user passwords are never overwritten.
            if (env('AICS_SEED_PASSWORD')) {
                $user->forceFill([
                    'password' => bcrypt((string) env('AICS_SEED_PASSWORD')),
                    'must_change_password' => false,
                    'status' => 'Active',
                ])->save();
            }
        }

        foreach ([
            ['Bupharco Pharmacy','North Poblacion, Maramag, Bukidnon','0917-123-4567'],
            ['King David Pharmacy','Maramag, Bukidnon','0928-234-5678'],
            ['Bongcas Holy Child Hospital','Maramag, Bukidnon','0939-345-6789'],
            ['St. Joseph Hospital','Maramag, Bukidnon','0945-456-7890'],
        ] as [$name,$address,$contact]) {
            PartnerAgency::firstOrCreate(['name' => $name],['address' => $address,'contact' => $contact,'status' => 'Active']);
        }

        foreach (['Anahawon','Bagontaas','Base Camp','Bayabason','Camp 1','Colambugon','Dagumba-an','Danggawan','Dibulawan','Kisanday','Kuya','Laican','North Poblacion','South Poblacion','Poblacion','Panadtalan','Panalsalan','San Miguel','Tubigon'] as $name) {
            Barangay::firstOrCreate(['name' => $name],['is_active' => true]);
        }

        $types = [
            'Medical' => ['4 sets (sample)',['Barangay indigency certificate','Valid ID of the client','Medical certificate or prescription (dated)','Bill or quotation from the pharmacy or hospital','Photocopies of the documents above (4 sets)']],
            'Burial' => ['3 sets (sample)',['Barangay certificate of indigency','Valid ID of the claimant','Death certificate (certified true copy)','Funeral contract / statement of account']],
            'Fire incident' => ['3 sets (sample)',['Barangay certificate of indigency','Bureau of Fire Protection (BFP) certification','Valid government ID of the affected household head']],
            'Transportation' => ['2 sets (sample)',['Barangay indigency certificate','Valid ID of the client','Police blotter / Referral or ticket quotation']],
            'Food' => ['2 sets (sample)',['Barangay indigency certificate','Valid ID of the client']],
            'Cash' => ['3 sets (sample)',['Barangay indigency certificate','Valid ID of the client','Social worker case assessment report']],
        ];
        foreach ($types as $name => [$copies,$requirements]) {
            $type = AssistanceType::firstOrCreate(['name' => $name],['copies' => $copies,'status' => 'Active']);
            foreach ($requirements as $i => $requirement) AssistanceRequirement::firstOrCreate(['assistance_type_id' => $type->id,'requirement' => $requirement],['sort_order' => $i + 1,'is_required' => true]);
        }

        foreach ([
            ['noted','Noted by (all documents)','Maria Theresa S. Aleria, RSW','Municipal Social Welfare & Development Officer'],
            ['mayor','Approved (Guarantee Letter)','Atty. Jose Joel P. Maniquis','Municipal Mayor'],
            ['aide','Prepared by (Guarantee Letter)','Ana Dela Cruz','Admin Aide IV'],
            ['worker','Interviewed by (GIS)','Ana Dela Cruz','SWAide / SW Assistant / SWO'],
        ] as [$key,$label,$name,$title]) {
            Signatory::firstOrCreate(['key' => $key],['role_label' => $label,'name' => $name,'title' => $title]);
        }

        foreach (['waitingPeriodMonths' => 3,'glValidityDays' => 9,'logoutTimeoutMinutes' => 10,'keepDraftsDays' => 30] as $key => $value) {
            SystemSetting::firstOrCreate(['key' => $key],['value' => ['value' => $value]]);
        }
    }
}
