<?php

namespace Tests\Feature\Api;

use App\Models\AssistanceType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionFormDataPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_transaction_creation_persists_subcategories_and_family_composition(): void
    {
        $staff = User::factory()->withRole('Staff')->create();
        $assistance = AssistanceType::create([
            'name' => 'Medical',
            'status' => 'Active',
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/transactions', [
                'transaction_date' => now()->toDateString(),
                'client_type' => 'Returning',
                'source' => 'Walk-in',
                'target_sector' => 'FHONA',
                'sub_category' => 'Solo parents, Others: Person with a chronic condition',
                'assistance_type_id' => $assistance->id,
                'assistance_provided' => 'Medical assistance',
                'amount' => 1500,
                'amount_words' => 'ONE THOUSAND FIVE HUNDRED PESOS ONLY',
                'fund_source' => 'MSWDO',
                'purpose' => 'Medical expenses',
                'client' => [
                    'last_name' => 'Santos',
                    'first_name' => 'Maria',
                    'middle_name' => 'Lopez',
                    'full_name' => 'Maria Lopez Santos',
                    'monthly_salary' => 8000,
                ],
                'beneficiary' => [
                    'last_name' => 'Santos',
                    'first_name' => 'Juan',
                    'full_name' => 'Juan Santos',
                    'relationship_to_client' => 'Son',
                ],
                'family_members' => [
                    [
                        'full_name' => 'Maria Lopez Santos',
                        'relationship' => 'Client',
                        'age' => 41,
                        'civil_status' => 'Married',
                        'occupation' => 'Vendor',
                        'monthly_salary' => 8000,
                    ],
                    [
                        'full_name' => 'Juan Santos',
                        'relationship' => 'Son',
                        'age' => 10,
                        'civil_status' => 'Single',
                        'occupation' => 'Student',
                        'monthly_salary' => 0,
                    ],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.sub_category', 'Solo parents, Others: Person with a chronic condition')
            ->assertJsonCount(2, 'data.family_members')
            ->assertJsonPath('data.family_members.1.full_name', 'Juan Santos')
            ->assertJsonPath('data.family_members.1.monthly_salary', '0.00');

        $this->assertDatabaseHas('family_members', [
            'transaction_id' => $response->json('data.id'),
            'full_name' => 'Juan Santos',
            'relationship' => 'Son',
        ]);
        $this->assertDatabaseHas('clients', [
            'id' => $response->json('data.client.id'),
            'monthly_salary' => 8000,
        ]);
    }

    public function test_transaction_search_returns_saved_family_composition(): void
    {
        $staff = User::factory()->withRole('Staff')->create();

        $created = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/transactions', [
                'transaction_date' => now()->toDateString(),
                'client_type' => 'Returning',
                'source' => 'Walk-in',
                'amount' => 1000,
                'client' => [
                    'last_name' => 'Search',
                    'first_name' => 'Requester',
                    'full_name' => 'Requester Search',
                ],
                'beneficiary' => [
                    'last_name' => 'Santos',
                    'first_name' => 'Juan',
                    'full_name' => 'Juan Santos',
                ],
                'family_members' => [
                    [
                        'full_name' => 'Juan Santos',
                        'relationship' => 'Self',
                        'age' => 35,
                        'civil_status' => 'Single',
                        'occupation' => 'Driver',
                        'monthly_salary' => 9000,
                    ],
                ],
            ])
            ->assertCreated();

        $id = $created->json('data.id');

        $this->getJson('/api/v1/transactions/search?q=Juan')
            ->assertOk()
            ->assertJsonPath('data.0.id', $id)
            ->assertJsonCount(1, 'data.0.family_members')
            ->assertJsonPath('data.0.family_members.0.full_name', 'Juan Santos');
    }

    public function test_person_birthdates_serialize_as_date_only_values_in_api_responses(): void
    {
        $staff = User::factory()->withRole('Staff')->create();

        $created = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/transactions', [
                'transaction_date' => now()->toDateString(),
                'client_type' => 'Returning',
                'source' => 'Walk-in',
                'amount' => 1000,
                'client' => [
                    'last_name' => 'Calendar',
                    'first_name' => 'Requester',
                    'full_name' => 'Requester Calendar',
                    'birthdate' => '1985-04-12',
                ],
                'beneficiary' => [
                    'last_name' => 'Calendar',
                    'first_name' => 'Beneficiary',
                    'full_name' => 'Beneficiary Calendar',
                    'birthdate' => '1990-03-02',
                ],
            ]);

        $created->assertCreated()
            ->assertJsonPath('data.client.birthdate', '1985-04-12')
            ->assertJsonPath('data.beneficiary.birthdate', '1990-03-02');

        $this->getJson('/api/v1/transactions/search?q=Calendar')
            ->assertOk()
            ->assertJsonPath('data.0.client.birthdate', '1985-04-12')
            ->assertJsonPath('data.0.beneficiary.birthdate', '1990-03-02');
    }
}
