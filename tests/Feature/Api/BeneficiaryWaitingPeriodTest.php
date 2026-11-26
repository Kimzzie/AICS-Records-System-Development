<?php

namespace Tests\Feature\Api;

use App\Models\AicsTransaction;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BeneficiaryWaitingPeriodTest extends TestCase
{
    use RefreshDatabase;

    private function staff(): User
    {
        return User::factory()->withRole('Staff')->create();
    }

    private function configureWaitingPeriod(int $months = 3): void
    {
        SystemSetting::updateOrCreate(
            ['key' => 'waitingPeriodMonths'],
            ['value' => ['value' => $months]],
        );
    }

    private function recordPreviousAssistanceForPerson(
        string $name,
        string $birthdate,
        int $monthsAgo,
        string $role
    ): AicsTransaction {
        $client = Client::create([
            'last_name' => 'Previous',
            'first_name' => 'Requester',
            'full_name' => $role === 'client' ? $name : 'Previous Requester',
            'birthdate' => $role === 'client' ? $birthdate : null,
        ]);

        $beneficiary = Beneficiary::create([
            'last_name' => 'Previous',
            'first_name' => 'Beneficiary',
            'full_name' => $role === 'beneficiary' ? $name : 'Previous Beneficiary',
            'birthdate' => $role === 'beneficiary' ? $birthdate : null,
        ]);

        return AicsTransaction::create([
            'gl_number' => 'PREV-'.strtoupper(substr(sha1($name.$birthdate.$monthsAgo.$role), 0, 8)),
            'transaction_date' => now()->subMonthsNoOverflow($monthsAgo)->toDateString(),
            'client_id' => $client->id,
            'beneficiary_id' => $beneficiary->id,
            'created_by' => $this->staff()->id,
            'amount' => 1000,
        ]);
    }

    private function transactionPayload(array $client = [], array $beneficiary = []): array
    {
        return [
            'transaction_date' => now()->toDateString(),
            'client_type' => 'Returning',
            'source' => 'Walk-in',
            'amount' => 1000,
            'client' => array_merge([
                'last_name' => 'New',
                'first_name' => 'Requester',
                'full_name' => 'Requester New',
                'birthdate' => '1985-01-01',
            ], $client),
            'beneficiary' => array_merge([
                'last_name' => 'New',
                'first_name' => 'Beneficiary',
                'full_name' => 'Beneficiary New',
                'birthdate' => '1990-01-01',
            ], $beneficiary),
        ];
    }

    private function eligibilityUrl(string $name, ?string $birthdate = null): string
    {
        $query = ['name' => $name];
        if ($birthdate !== null) {
            $query['birthdate'] = $birthdate;
        }

        return '/api/v1/beneficiaries/eligibility?'.http_build_query($query);
    }

    public function test_exact_beneficiary_within_the_configured_waiting_period_is_not_eligible(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Maria Santos', '1980-05-14', 2, 'beneficiary');

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson($this->eligibilityUrl('Maria Santos', '1980-05-14'))
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('identity_status', 'confirmed_match')
            ->assertJsonPath('waiting_period_months', 3)
            ->assertJsonPath('matches.0.beneficiary_name', 'Maria Santos');
    }

    public function test_name_only_candidate_does_not_automatically_block_when_birthdate_is_not_yet_known(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Maria Santos', '1980-05-14', 2, 'beneficiary');

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson($this->eligibilityUrl('Maria Santos'))
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('identity_status', 'verification_required')
            ->assertJsonPath('waiting_period_months', 3)
            ->assertJsonPath('matches.0.beneficiary_name', 'Maria Santos');
    }

    public function test_same_name_with_a_different_birthdate_is_a_possible_match_not_an_automatic_block(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Maria Santos', '1980-05-14', 2, 'beneficiary');

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson($this->eligibilityUrl('Maria Santos', '1990-05-14'))
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('identity_status', 'possible_name_match')
            ->assertJsonPath('matches.0.beneficiary_name', 'Maria Santos');
    }

    public function test_beneficiary_whose_exact_identity_waiting_period_has_elapsed_is_eligible_and_history_is_returned(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Elena Garcia', '1977-10-03', 4, 'beneficiary');

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson($this->eligibilityUrl('Elena Garcia', '1977-10-03'))
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('identity_status', 'confirmed_match')
            ->assertJsonPath('waiting_period_months', 3)
            ->assertJsonPath('matches.0.beneficiary_name', 'Elena Garcia');
    }

    public function test_exact_identity_is_eligible_on_the_waiting_period_boundary_date(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Boundary Santos', '1982-03-29', 3, 'beneficiary');

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson($this->eligibilityUrl('Boundary Santos', '1982-03-29'))
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('identity_status', 'confirmed_match')
            ->assertJsonPath('waiting_period_months', 3);
    }

    public function test_missing_waiting_period_setting_uses_the_existing_three_month_default(): void
    {
        $this->recordPreviousAssistanceForPerson('Default Santos', '1979-06-11', 2, 'beneficiary');

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson($this->eligibilityUrl('Default Santos', '1979-06-11'))
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('identity_status', 'confirmed_match')
            ->assertJsonPath('waiting_period_months', 3);
    }

    public function test_waiting_period_uses_the_configured_setting_not_a_hard_coded_three_months(): void
    {
        $this->configureWaitingPeriod(1);
        $this->recordPreviousAssistanceForPerson('Pedro Reyes', '1984-08-09', 2, 'beneficiary');

        $this->actingAs($this->staff(), 'sanctum')
            ->getJson($this->eligibilityUrl('Pedro Reyes', '1984-08-09'))
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('identity_status', 'confirmed_match')
            ->assertJsonPath('waiting_period_months', 1);
    }

    public function test_transaction_creation_allows_a_beneficiary_after_the_exact_identity_waiting_period(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Elena Garcia', '1977-10-03', 4, 'beneficiary');

        $payload = $this->transactionPayload([], [
            'last_name' => 'Garcia',
            'first_name' => 'Elena',
            'full_name' => 'Elena Garcia',
            'birthdate' => '1977-10-03',
        ]);

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->postJson('/api/v1/transactions', $payload);

        $response->assertCreated()
            ->assertJsonPath('message', 'Transaction saved.');

        $this->assertDatabaseHas('aics_transactions', [
            'beneficiary_id' => $response->json('data.beneficiary.id'),
        ]);
    }

    public function test_transaction_creation_blocks_a_beneficiary_with_the_same_name_and_birthdate_within_the_waiting_period(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Maria Santos', '1980-05-14', 2, 'beneficiary');

        $payload = $this->transactionPayload([], [
            'last_name' => 'Santos',
            'first_name' => 'Maria',
            'full_name' => 'Maria Santos',
            'birthdate' => '1980-05-14',
        ]);

        $this->actingAs($this->staff(), 'sanctum')
            ->postJson('/api/v1/transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('beneficiary.full_name');
    }

    public function test_transaction_creation_blocks_a_requester_matching_a_previous_beneficiary(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Maria Santos', '1980-05-14', 2, 'beneficiary');

        $payload = $this->transactionPayload([
            'last_name' => 'Santos',
            'first_name' => 'Maria',
            'full_name' => 'Maria Santos',
            'birthdate' => '1980-05-14',
        ]);

        $this->actingAs($this->staff(), 'sanctum')
            ->postJson('/api/v1/transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('client.full_name');
    }

    public function test_transaction_creation_blocks_a_beneficiary_matching_a_previous_requester(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Pedro Reyes', '1984-08-09', 2, 'client');

        $payload = $this->transactionPayload([], [
            'last_name' => 'Reyes',
            'first_name' => 'Pedro',
            'full_name' => 'Pedro Reyes',
            'birthdate' => '1984-08-09',
        ]);

        $this->actingAs($this->staff(), 'sanctum')
            ->postJson('/api/v1/transactions', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('beneficiary.full_name');
    }

    public function test_transaction_creation_allows_the_same_name_when_birthdate_identifies_a_different_person(): void
    {
        $this->configureWaitingPeriod(3);
        $this->recordPreviousAssistanceForPerson('Maria Santos', '1980-05-14', 2, 'beneficiary');

        $payload = $this->transactionPayload([], [
            'last_name' => 'Santos',
            'first_name' => 'Maria',
            'full_name' => 'Maria Santos',
            'birthdate' => '1990-05-14',
        ]);

        $response = $this->actingAs($this->staff(), 'sanctum')
            ->postJson('/api/v1/transactions', $payload);

        $response->assertCreated()
            ->assertJsonPath('message', 'Transaction saved.')
            ->assertJsonPath('identity_warnings.0.role', 'beneficiary')
            ->assertJsonPath('identity_warnings.0.status', 'possible_name_match');
    }

    public function test_full_history_is_paginated_after_the_ten_record_default(): void
    {
        for ($monthsAgo = 0; $monthsAgo < 12; $monthsAgo++) {
            $this->recordPreviousAssistanceForPerson(
                'History Santos',
                '1985-04-12',
                $monthsAgo,
                'beneficiary',
            );
        }

        $firstPage = $this->actingAs($this->staff(), 'sanctum')
            ->getJson('/api/v1/beneficiaries/history?name='.urlencode('History Santos').'&per_page=10&page=1')
            ->assertOk()
            ->assertJsonPath('pagination.current_page', 1)
            ->assertJsonPath('pagination.last_page', 2)
            ->assertJsonPath('pagination.per_page', 10)
            ->assertJsonPath('pagination.total', 12);
        $this->assertCount(10, $firstPage->json('data'));

        $secondPage = $this->actingAs($this->staff(), 'sanctum')
            ->getJson('/api/v1/beneficiaries/history?name='.urlencode('History Santos').'&per_page=10&page=2')
            ->assertOk()
            ->assertJsonPath('pagination.current_page', 2)
            ->assertJsonPath('pagination.total', 12);
        $this->assertCount(2, $secondPage->json('data'));
    }
}
