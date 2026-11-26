<?php

namespace Tests\Feature\Api;

use App\Models\AicsTransaction;
use App\Models\AssistanceType;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ViewerAssistanceVerificationTest extends TestCase
{
    use RefreshDatabase;

    private int $transactionSequence = 1;

    public function test_viewer_receives_only_date_and_assistance_type_for_exact_client_match(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $client = $this->makeClient('Synthetic Example', '1990-01-15');
        $beneficiary = $this->makeBeneficiary('Other Person', '1985-02-20');
        $assistanceType = AssistanceType::create(['name' => 'Medical']);

        $this->makeTransaction($client, $beneficiary, [
            'transaction_date' => '2026-10-14',
            'assistance_type_id' => $assistanceType->id,
            'assistance_provided' => 'Synthetic medical assistance',
            'amount' => 2500,
            'purpose' => 'Synthetic test purpose',
            'case_summary' => 'Synthetic test case summary',
        ]);

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'Synthetic Example',
            'birthdate' => '1990-01-15',
        ]);

        $response->assertOk()->assertExactJson([
            'data' => [
                'match_status' => 'confirmed_match',
                'records' => [
                    [
                        'transaction_date' => '2026-10-14',
                        'assistance_type' => 'Medical',
                    ],
                ],
            ],
        ]);

        $this->assertRecordWhitelist($response->json('data.records.0'));
        $this->assertPrivateNoStore($response);
    }

    public function test_viewer_receives_history_when_exact_person_match_is_a_beneficiary(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $client = $this->makeClient('Unrelated Client', '1980-01-01');
        $beneficiary = $this->makeBeneficiary('Synthetic Beneficiary', '1991-04-12');
        $type = AssistanceType::create(['name' => 'Burial']);

        $this->makeTransaction($client, $beneficiary, [
            'transaction_date' => '2026-09-02',
            'assistance_type_id' => $type->id,
        ]);

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'Synthetic Beneficiary',
            'birthdate' => '1991-04-12',
        ]);

        $response->assertOk()->assertExactJson([
            'data' => [
                'match_status' => 'confirmed_match',
                'records' => [[
                    'transaction_date' => '2026-09-02',
                    'assistance_type' => 'Burial',
                ]],
            ],
        ]);
        $this->assertRecordWhitelist($response->json('data.records.0'));
    }

    public function test_same_name_with_different_birthdate_returns_possible_match_without_records(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $client = $this->makeClient('Synthetic Example', '1990-01-15');
        $beneficiary = $this->makeBeneficiary('Unrelated Person', '1985-02-20');
        $this->makeTransaction($client, $beneficiary);

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'Synthetic Example',
            'birthdate' => '1992-03-18',
        ]);

        $response->assertOk()->assertExactJson([
            'data' => [
                'match_status' => 'possible_match',
                'records' => [],
            ],
        ]);
    }

    public function test_same_name_with_missing_record_birthdate_returns_possible_match_without_records(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $client = Client::create([
            'last_name' => 'Example',
            'first_name' => 'Synthetic',
            'full_name' => 'Synthetic Missing Date',
            'birthdate' => null,
        ]);
        $beneficiary = $this->makeBeneficiary('Unrelated Person', '1985-02-20');
        $this->makeTransaction($client, $beneficiary);

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'Synthetic Missing Date',
            'birthdate' => '1990-01-15',
        ]);

        $response->assertOk()->assertExactJson([
            'data' => [
                'match_status' => 'possible_match',
                'records' => [],
            ],
        ]);
    }

    public function test_no_name_match_returns_no_match_without_records(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $client = $this->makeClient('Existing Synthetic Person', '1990-01-15');
        $beneficiary = $this->makeBeneficiary('Unrelated Person', '1985-02-20');
        $this->makeTransaction($client, $beneficiary);

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'No Matching Person',
            'birthdate' => '1990-01-15',
        ]);

        $response->assertOk()->assertExactJson([
            'data' => [
                'match_status' => 'no_match',
                'records' => [],
            ],
        ]);
    }

    public function test_matching_records_are_sorted_newest_first_without_duplicates(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $clientPerson = $this->makeClient('Synthetic Example', '1990-01-15');
        $beneficiaryPerson = $this->makeBeneficiary('Synthetic Example', '1990-01-15');
        $unrelatedClient = $this->makeClient('Unrelated Client', '1980-01-01');
        $unrelatedBeneficiary = $this->makeBeneficiary('Unrelated Beneficiary', '1985-02-20');
        $medical = AssistanceType::create(['name' => 'Medical']);

        $this->makeTransaction($clientPerson, $beneficiaryPerson, [
            'transaction_date' => '2026-01-10',
            'assistance_type_id' => $medical->id,
            'status' => 'Synthetic Unclassified Status',
        ]);

        $this->makeTransaction($unrelatedClient, $beneficiaryPerson, [
            'transaction_date' => '2026-10-14',
            'assistance_type_id' => null,
            'assistance_provided' => 'Synthetic fallback assistance',
        ]);

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'SYNTHETIC.   EXAMPLE',
            'birthdate' => '1990-01-15',
        ]);

        $response->assertOk()->assertExactJson([
            'data' => [
                'match_status' => 'confirmed_match',
                'records' => [
                    [
                        'transaction_date' => '2026-10-14',
                        'assistance_type' => 'Synthetic fallback assistance',
                    ],
                    [
                        'transaction_date' => '2026-01-10',
                        'assistance_type' => 'Medical',
                    ],
                ],
            ],
        ]);

        $records = $response->json('data.records');
        $this->assertCount(2, $records);
        foreach ($records as $record) {
            $this->assertRecordWhitelist($record);
        }
    }

    public function test_disabled_feature_returns_503_before_searching(): void
    {
        config()->set('viewer-assistance.enabled', false);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'Synthetic Example',
            'birthdate' => '1990-01-15',
        ]);

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $response->assertStatus(503)->assertExactJson([
            'message' => 'Assistance verification is temporarily unavailable.',
        ]);
        $this->assertPrivateNoStore($response);
        $this->assertFalse(
            collect($queries)->contains(
                fn (array $query) => preg_match('/\b(clients|beneficiaries)\b/i', $query['query']) === 1
            ),
            'Disabled verification must not query client or beneficiary records.'
        );
    }

    public function test_name_and_birthdate_are_required_and_bounded(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $invalidPayloads = [
            ['birthdate' => '1990-01-15'],
            ['name' => 'Synthetic Example'],
            ['name' => 'A', 'birthdate' => '1990-01-15'],
            ['name' => str_repeat('A', 256), 'birthdate' => '1990-01-15'],
            ['name' => 'Synthetic Example', 'birthdate' => '01/15/1990'],
        ];

        foreach ($invalidPayloads as $payload) {
            $this->postJson('/api/v1/viewer/assistance-verification', $payload)
                ->assertUnprocessable();
        }
    }

    public function test_non_viewer_roles_cannot_call_viewer_verification(): void
    {
        config()->set('viewer-assistance.enabled', true);

        foreach (['Staff', 'Senior staff', 'Administrator'] as $role) {
            Sanctum::actingAs(User::factory()->withRole($role)->create());

            $this->postJson('/api/v1/viewer/assistance-verification', [
                'name' => 'Synthetic Example',
                'birthdate' => '1990-01-15',
            ])->assertForbidden();
        }
    }

    public function test_viewer_verification_is_rate_limited_per_account(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $this->postJson('/api/v1/viewer/assistance-verification', [
                'name' => 'No Matching Synthetic Person',
                'birthdate' => '1990-01-15',
            ])->assertOk();
        }

        $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'No Matching Synthetic Person',
            'birthdate' => '1990-01-15',
        ])->assertStatus(429);
    }

    public function test_verification_audit_context_excludes_name_and_birthdate(): void
    {
        config()->set('viewer-assistance.enabled', true);
        $viewer = User::factory()->withRole('Viewer')->create();
        Sanctum::actingAs($viewer);
        Log::spy();

        $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'Synthetic Private Name',
            'birthdate' => '1990-01-15',
        ])->assertOk();

        Log::shouldHaveReceived('info')->once()->with(
            'viewer_assistance_verification',
            [
                'viewer_id' => $viewer->id,
                'match_status' => 'no_match',
                'records_returned' => 0,
            ]
        );
    }

    public function test_verification_responses_are_not_cacheable(): void
    {
        config()->set('viewer-assistance.enabled', true);
        Sanctum::actingAs(User::factory()->withRole('Viewer')->create());

        $response = $this->postJson('/api/v1/viewer/assistance-verification', [
            'name' => 'No Matching Synthetic Person',
            'birthdate' => '1990-01-15',
        ]);

        $response->assertOk();
        $this->assertPrivateNoStore($response);
    }

    private function makeClient(string $fullName, string $birthdate): Client
    {
        $parts = explode(' ', $fullName, 2);

        return Client::create([
            'last_name' => $parts[1] ?? $parts[0],
            'first_name' => $parts[0],
            'full_name' => $fullName,
            'birthdate' => $birthdate,
        ]);
    }

    private function makeBeneficiary(string $fullName, string $birthdate): Beneficiary
    {
        $parts = explode(' ', $fullName, 2);

        return Beneficiary::create([
            'last_name' => $parts[1] ?? $parts[0],
            'first_name' => $parts[0],
            'full_name' => $fullName,
            'birthdate' => $birthdate,
        ]);
    }

    private function makeTransaction(Client $client, Beneficiary $beneficiary, array $overrides = []): AicsTransaction
    {
        return AicsTransaction::create(array_merge([
            'gl_number' => sprintf('SYNTH-VIEWER-%03d', $this->transactionSequence++),
            'transaction_date' => '2026-10-14',
            'client_id' => $client->id,
            'beneficiary_id' => $beneficiary->id,
            'assistance_type_id' => null,
            'assistance_provided' => 'Synthetic assistance',
            'amount' => 1250,
            'purpose' => 'Synthetic purpose',
            'case_summary' => 'Synthetic summary',
            'status' => 'Saved',
        ], $overrides));
    }

    private function assertRecordWhitelist(array $record): void
    {
        $this->assertSame(['transaction_date', 'assistance_type'], array_keys($record));
        foreach ([
            'gl_number', 'name', 'full_name', 'client_id', 'beneficiary_id',
            'amount', 'purpose', 'address', 'contact_person', 'contact_number',
            'case_summary', 'partner_agency_id', 'worker_name', 'family_members',
            'status', 'audit_logs',
        ] as $forbiddenKey) {
            $this->assertArrayNotHasKey($forbiddenKey, $record);
        }
    }

    private function assertPrivateNoStore($response): void
    {
        $directives = array_map(
            'trim',
            explode(',', strtolower($response->headers->get('Cache-Control', '')))
        );

        $this->assertEqualsCanonicalizing(['private', 'no-store'], $directives);
    }
}
