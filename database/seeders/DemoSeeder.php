<?php

namespace Database\Seeders;

use App\Models\AicsTransaction;
use App\Models\AssistanceType;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\PartnerAgency;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. CLEAN TRANSACTION DATA (keep config tables) ─────────────────
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('transaction_audit_logs')->truncate();
        DB::table('transaction_drafts')->truncate();
        DB::table('family_members')->truncate();
        DB::table('aics_transactions')->truncate();
        DB::table('beneficiaries')->truncate();
        DB::table('clients')->truncate();
        DB::table('aics_monthly_budgets')->truncate();
        DB::table('personal_access_tokens')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ── 2. RESET USER PASSWORDS TO DEMO PASSWORD ───────────────────────
        $demoPassword = Hash::make('Demo@2026');
        User::query()->update([
            'password'            => $demoPassword,
            'must_change_password' => false,
            'status'              => 'Active',
        ]);

        $admin  = User::where('role', 'Administrator')->first();
        $staff  = User::where('role', 'Staff')->first();
        $senior = User::where('role', 'Senior staff')->first();

        // ── 3. PARTNER AGENCIES & ASSISTANCE TYPES ─────────────────────────
        $bupharco  = PartnerAgency::where('name', 'like', 'Bupharco%')->first();
        $kingDavid = PartnerAgency::where('name', 'like', 'King David%')->first();
        $bongcas   = PartnerAgency::where('name', 'like', 'Bongcas%')->first();
        $stJoseph  = PartnerAgency::where('name', 'like', 'St. Joseph%')->first();

        $medical    = AssistanceType::where('name', 'Medical')->first();
        $burial     = AssistanceType::where('name', 'Burial')->first();
        $food       = AssistanceType::where('name', 'Food')->first();
        $transport  = AssistanceType::where('name', 'Transportation')->first();
        $cash       = AssistanceType::where('name', 'Cash')->first();
        $fire       = AssistanceType::where('name', 'Fire incident')->first();

        // ── 4. DEMO RECORDS ────────────────────────────────────────────────
        // Using popular artist names as client names for a memorable demo.
        // Scenario mix: 3-month block, eligible returning, pending GL, issued GL.

        $records = [
            // GL 0001 — Sabrina Carpenter: Medical, Oct 15 → within 3 months → BLOCKED on search
            [
                'gl'      => '0001-2026',
                'date'    => '2026-10-15',
                'client'  => ['last_name' => 'Carpenter', 'first_name' => 'Sabrina', 'middle_name' => 'A.', 'barangay' => 'South Poblacion', 'birthdate' => '1999-05-11', 'gender' => 'Female', 'civil_status' => 'Single', 'occupation' => 'Artist', 'monthly_salary' => 0],
                'bene'    => ['last_name' => 'Carpenter', 'first_name' => 'Sabrina', 'middle_name' => 'A.', 'barangay' => 'South Poblacion', 'birthdate' => '1999-05-11', 'gender' => 'Female', 'civil_status' => 'Single', 'relationship_to_client' => 'Self'],
                'type'    => $medical,
                'agency'  => $bupharco,
                'provided' => 'Medical assistance',
                'purpose'  => 'Medicine / Hospital bill',
                'amount'   => 5000,
                'words'    => 'FIVE THOUSAND PESOS ONLY',
                'summary'  => 'Client sought medical assistance for hospital bills. Single, unemployed, with no other source of income. Recommended for immediate financial support.',
                'issued'   => true,
                'issued_at' => '2026-10-15 10:30:00',
            ],

            // GL 0002 — Chappell Roan: Burial, Jul 20 → more than 3 months ago → ELIGIBLE RETURNING
            [
                'gl'      => '0002-2026',
                'date'    => '2026-07-20',
                'client'  => ['last_name' => 'Roan', 'first_name' => 'Chappell', 'middle_name' => 'B.', 'barangay' => 'North Poblacion', 'birthdate' => '1998-02-19', 'gender' => 'Female', 'civil_status' => 'Single', 'occupation' => 'Artist', 'monthly_salary' => 0],
                'bene'    => ['last_name' => 'Roan', 'first_name' => 'Chappell', 'middle_name' => 'B.', 'barangay' => 'North Poblacion', 'birthdate' => '1998-02-19', 'gender' => 'Female', 'civil_status' => 'Single', 'relationship_to_client' => 'Self'],
                'type'    => $burial,
                'agency'  => $kingDavid,
                'provided' => 'Burial assistance',
                'purpose'  => 'Funeral / Burial expenses',
                'amount'   => 5000,
                'words'    => 'FIVE THOUSAND PESOS ONLY',
                'summary'  => 'Client requested burial assistance for a deceased family member. No stable income. Assessment confirms eligibility for financial aid.',
                'issued'   => true,
                'issued_at' => '2026-07-20 09:15:00',
            ],

            // GL 0003 — Billie Eilish: Food, Nov 5 → SAVED, GL NOT YET ISSUED (pending issuance demo)
            [
                'gl'      => '0003-2026',
                'date'    => '2026-11-05',
                'client'  => ['last_name' => 'Eilish', 'first_name' => 'Billie', 'middle_name' => 'P.', 'barangay' => 'Bagontaas', 'birthdate' => '2001-12-18', 'gender' => 'Female', 'civil_status' => 'Single', 'occupation' => 'None', 'monthly_salary' => 0],
                'bene'    => ['last_name' => 'Eilish', 'first_name' => 'Billie', 'middle_name' => 'P.', 'barangay' => 'Bagontaas', 'birthdate' => '2001-12-18', 'gender' => 'Female', 'civil_status' => 'Single', 'relationship_to_client' => 'Self'],
                'type'    => $food,
                'agency'  => $bupharco,
                'provided' => 'Food assistance',
                'purpose'  => 'Food / Basic necessities',
                'amount'   => 3000,
                'words'    => 'THREE THOUSAND PESOS ONLY',
                'summary'  => 'Client is a solo parent with two dependents. No regular income. Requesting assistance for basic food needs while awaiting employment.',
                'issued'   => false,
                'issued_at' => null,
            ],

            // GL 0004 — Kendrick Lamar: Transportation, Nov 10 → issued
            [
                'gl'      => '0004-2026',
                'date'    => '2026-11-10',
                'client'  => ['last_name' => 'Lamar', 'first_name' => 'Kendrick', 'middle_name' => 'D.', 'barangay' => 'Kisanday', 'birthdate' => '1987-06-17', 'gender' => 'Male', 'civil_status' => 'Married', 'occupation' => 'Laborer', 'monthly_salary' => 3000],
                'bene'    => ['last_name' => 'Lamar', 'first_name' => 'Kendrick', 'middle_name' => 'D.', 'barangay' => 'Kisanday', 'birthdate' => '1987-06-17', 'gender' => 'Male', 'civil_status' => 'Married', 'relationship_to_client' => 'Self'],
                'type'    => $transport,
                'agency'  => $bupharco,
                'provided' => 'Transportation assistance',
                'purpose'  => 'Transportation fare',
                'amount'   => 5000,
                'words'    => 'FIVE THOUSAND PESOS ONLY',
                'summary'  => 'Client requires transportation fare to bring a critically ill family member to a medical facility in Cagayan de Oro City. Insufficient funds for travel.',
                'issued'   => true,
                'issued_at' => '2026-11-10 14:00:00',
            ],

            // GL 0005 — Taylor Swift: Medical, Nov 15 → issued, highest amount
            [
                'gl'      => '0005-2026',
                'date'    => '2026-11-15',
                'client'  => ['last_name' => 'Swift', 'first_name' => 'Taylor', 'middle_name' => 'A.', 'barangay' => 'Colambugon', 'birthdate' => '1989-12-13', 'gender' => 'Female', 'civil_status' => 'Single', 'occupation' => 'None', 'monthly_salary' => 0],
                'bene'    => ['last_name' => 'Swift', 'first_name' => 'Taylor', 'middle_name' => 'A.', 'barangay' => 'Colambugon', 'birthdate' => '1989-12-13', 'gender' => 'Female', 'civil_status' => 'Single', 'relationship_to_client' => 'Self'],
                'type'    => $medical,
                'agency'  => $stJoseph,
                'provided' => 'Medical assistance',
                'purpose'  => 'Medicine / Hospital bill',
                'amount'   => 8000,
                'words'    => 'EIGHT THOUSAND PESOS ONLY',
                'summary'  => 'Client was confined at St. Joseph Hospital following an acute illness. No PhilHealth coverage. Family has no other means to cover hospital expenses.',
                'issued'   => true,
                'issued_at' => '2026-11-15 10:00:00',
            ],

            // GL 0006 — Olivia Rodrigo: Cash, Nov 18 → issued
            [
                'gl'      => '0006-2026',
                'date'    => '2026-11-18',
                'client'  => ['last_name' => 'Rodrigo', 'first_name' => 'Olivia', 'middle_name' => 'I.', 'barangay' => 'Dagumba-an', 'birthdate' => '2003-02-20', 'gender' => 'Female', 'civil_status' => 'Single', 'occupation' => 'Student', 'monthly_salary' => 0],
                'bene'    => ['last_name' => 'Rodrigo', 'first_name' => 'Olivia', 'middle_name' => 'I.', 'barangay' => 'Dagumba-an', 'birthdate' => '2003-02-20', 'gender' => 'Female', 'civil_status' => 'Single', 'relationship_to_client' => 'Self'],
                'type'    => $cash,
                'agency'  => $kingDavid,
                'provided' => 'Financial assistance for other support services',
                'purpose'  => 'Other support services',
                'amount'   => 7000,
                'words'    => 'SEVEN THOUSAND PESOS ONLY',
                'summary'  => 'Client is a college student supporting herself with no parental support. Financial crisis after loss of part-time employment. Requesting cash assistance for school and daily needs.',
                'issued'   => true,
                'issued_at' => '2026-11-18 11:30:00',
            ],

            // GL 0007 — Charli XCX: Fire incident, Nov 20 → issued
            [
                'gl'      => '0007-2026',
                'date'    => '2026-11-20',
                'client'  => ['last_name' => 'XCX', 'first_name' => 'Charli', 'middle_name' => null, 'barangay' => 'Dibulawan', 'birthdate' => '1992-08-02', 'gender' => 'Female', 'civil_status' => 'Single', 'occupation' => 'None', 'monthly_salary' => 0],
                'bene'    => ['last_name' => 'XCX', 'first_name' => 'Charli', 'middle_name' => null, 'barangay' => 'Dibulawan', 'birthdate' => '1992-08-02', 'gender' => 'Female', 'civil_status' => 'Single', 'relationship_to_client' => 'Self'],
                'type'    => $fire,
                'agency'  => $bongcas,
                'provided' => 'Financial assistance for fire incident victim',
                'purpose'  => 'Food / Clothing / Basic necessities',
                'amount'   => 8000,
                'words'    => 'EIGHT THOUSAND PESOS ONLY',
                'summary'  => 'Client lost her home and all belongings in a residential fire on November 19, 2026. Currently staying with neighbors. Requesting emergency assistance for immediate needs.',
                'issued'   => true,
                'issued_at' => '2026-11-20 08:45:00',
            ],
        ];

        foreach ($records as $r) {
            $clientData = array_merge($r['client'], [
                'full_name' => $r['client']['first_name'] . ' ' . ($r['client']['middle_name'] ? $r['client']['middle_name'] . ' ' : '') . $r['client']['last_name'],
                'city'     => 'Maramag',
                'province' => 'Bukidnon',
                'region'   => '10',
            ]);
            $client = Client::create($clientData);

            $beneData = array_merge($r['bene'], [
                'full_name' => $r['bene']['first_name'] . ' ' . ($r['bene']['middle_name'] ? $r['bene']['middle_name'] . ' ' : '') . $r['bene']['last_name'],
                'city'     => 'Maramag',
                'province' => 'Bukidnon',
                'region'   => '10',
            ]);
            $bene = Beneficiary::create($beneData);

            $txnData = [
                'gl_number'            => $r['gl'],
                'transaction_date'     => $r['date'],
                'client_id'            => $client->id,
                'beneficiary_id'       => $bene->id,
                'client_type'          => 'New',
                'source'               => 'Walk-in',
                'assistance_type_id'   => $r['type']?->id,
                'assistance_provided'  => $r['provided'],
                'purpose'              => $r['purpose'],
                'amount'               => $r['amount'],
                'amount_words'         => $r['words'],
                'fund_source'          => 'LGU',
                'partner_agency_id'    => $r['agency']?->id,
                'case_summary'         => $r['summary'],
                'worker_name'          => $staff?->name,
                'created_by'           => $staff?->id,
                'status'               => 'Saved',
                'valid_until'          => date('Y-m-d', strtotime($r['date'] . ' +9 days')),
            ];

            if ($r['issued']) {
                $txnData['guarantee_letter_issued_at'] = $r['issued_at'];
                $txnData['guaranteed_amount']          = $r['amount'];
            }

            AicsTransaction::create($txnData);
        }

        // ── 5. NOVEMBER 2026 BUDGET ────────────────────────────────────────
        // Issued this month: GL0004(5000) + GL0005(8000) + GL0006(7000) + GL0007(8000) = 28,000
        // Budget: 50,000 → 56% used → good visual on the dashboard bar
        DB::table('aics_monthly_budgets')->insert([
            'budget_month' => '2026-11',
            'total_budget' => 50000.00,
            'set_by'       => $admin?->id ?? 1,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $this->command->info('✓ Demo data seeded. All users password: Demo@2026');
        $this->command->info('  Roles: admin → Administrator | sstaff → Senior staff | staff → Staff | viewer → Viewer');
        $this->command->info('  7 transactions created. November budget: ₱50,000 (₱28,000 issued / 56%)');
        $this->command->info('  Sabrina Carpenter → 3-month block demo');
        $this->command->info('  Chappell Roan     → eligible returning client demo');
        $this->command->info('  Billie Eilish     → pending GL issuance demo');
    }
}
