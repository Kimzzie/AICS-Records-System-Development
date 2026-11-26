<?php

namespace Tests\Feature\Api;

use App\Models\AicsMonthlyBudget;
use App\Models\AicsTransaction;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\TransactionAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BudgetAndGuaranteeLetterTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        return User::factory()->withRole($role)->create();
    }

    private function createTransaction(
        string $transactionDate = '2026-11-20',
        string $amount = '1000.00',
        ?User $createdBy = null,
    ): AicsTransaction {
        $suffix = Str::upper(Str::random(12));

        $client = Client::create([
            'last_name' => 'Synthetic',
            'first_name' => 'Requester',
            'full_name' => 'Synthetic Requester '.$suffix,
        ]);

        $beneficiary = Beneficiary::create([
            'last_name' => 'Synthetic',
            'first_name' => 'Beneficiary',
            'full_name' => 'Synthetic Beneficiary '.$suffix,
        ]);

        return AicsTransaction::create([
            'gl_number' => 'TEST-'.$suffix,
            'transaction_date' => $transactionDate,
            'client_id' => $client->id,
            'beneficiary_id' => $beneficiary->id,
            'created_by' => $createdBy?->id,
            'amount' => $amount,
        ]);
    }

    private function createMonthlyBudget(string $month, string $totalBudget, User $setBy): AicsMonthlyBudget
    {
        return AicsMonthlyBudget::create([
            'budget_month' => $month,
            'total_budget' => $totalBudget,
            'set_by' => $setBy->id,
        ]);
    }

    public function test_empty_monthly_budget_summary_returns_zero_totals_for_the_requested_month(): void
    {
        $staff = $this->userWithRole('Staff');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/budget/monthly?month=2026-11')
            ->assertOk()
            ->assertJsonPath('month', '2026-11')
            ->assertJsonPath('total_budget', 0)
            ->assertJsonPath('used', 0)
            ->assertJsonPath('remaining', 0)
            ->assertJsonPath('issued_count', 0)
            ->assertJsonPath('transactions', []);

        $this->assertDatabaseCount('aics_monthly_budgets', 0);
        $this->assertDatabaseCount('aics_transactions', 0);
    }

    public function test_monthly_budget_summary_defaults_to_the_current_calendar_month(): void
    {
        $staff = $this->userWithRole('Staff');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/budget/monthly')
            ->assertOk()
            ->assertJsonPath('month', now()->format('Y-m'));
    }

    public function test_staff_senior_staff_and_administrator_can_read_monthly_budget_summary(): void
    {
        $administrator = $this->userWithRole('Administrator');
        $this->createMonthlyBudget('2026-11', '5000.00', $administrator);

        foreach (['Staff', 'Senior staff', 'Administrator'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->getJson('/api/v1/budget/monthly?month=2026-11')
                ->assertOk()
                ->assertJsonPath('month', '2026-11')
                ->assertJsonPath('total_budget', 5000);
        }
    }

    public function test_viewer_cannot_read_monthly_budget_summary(): void
    {
        $viewer = $this->userWithRole('Viewer');

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/v1/budget/monthly?month=2026-11')
            ->assertForbidden();
    }

    public function test_administrator_can_create_and_update_a_monthly_budget_for_the_same_month(): void
    {
        $firstAdministrator = $this->userWithRole('Administrator');
        $secondAdministrator = $this->userWithRole('Administrator');

        $this->actingAs($firstAdministrator, 'sanctum')
            ->putJson('/api/v1/budget/monthly', [
                'month' => '2026-11',
                'total_budget' => '5000.00',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Monthly budget saved.')
            ->assertJsonPath('data.total_budget', 5000);

        $this->actingAs($secondAdministrator, 'sanctum')
            ->putJson('/api/v1/budget/monthly', [
                'month' => '2026-11',
                'total_budget' => '7500.00',
            ])
            ->assertOk()
            ->assertJsonPath('data.total_budget', 7500);

        $this->assertDatabaseCount('aics_monthly_budgets', 1);
        $this->assertDatabaseHas('aics_monthly_budgets', [
            'budget_month' => '2026-11',
            'total_budget' => '7500.00',
            'set_by' => $secondAdministrator->id,
        ]);
    }

    public function test_staff_and_senior_staff_cannot_set_a_monthly_budget(): void
    {
        foreach (['Staff', 'Senior staff'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->putJson('/api/v1/budget/monthly', [
                    'month' => '2026-11',
                    'total_budget' => '5000.00',
                ])
                ->assertForbidden();
        }

        $this->assertDatabaseCount('aics_monthly_budgets', 0);
    }

    public function test_monthly_budget_rejects_invalid_month_negative_and_over_limit_totals(): void
    {
        $administrator = $this->userWithRole('Administrator');
        $invalidPayloads = [
            [
                'month' => 'not-a-month',
                'total_budget' => '1000.00',
                'error' => 'month',
            ],
            [
                'month' => '2026-11',
                'total_budget' => '-1.00',
                'error' => 'total_budget',
            ],
            [
                'month' => '2026-11',
                'total_budget' => '1000000000000.00',
                'error' => 'total_budget',
            ],
        ];

        foreach ($invalidPayloads as $payload) {
            $this->actingAs($administrator, 'sanctum')
                ->putJson('/api/v1/budget/monthly', [
                    'month' => $payload['month'],
                    'total_budget' => $payload['total_budget'],
                ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors($payload['error']);
        }

        $this->assertDatabaseCount('aics_monthly_budgets', 0);
    }

    public function test_administrator_can_set_a_zero_monthly_budget_when_no_amount_has_been_issued(): void
    {
        $administrator = $this->userWithRole('Administrator');

        $this->actingAs($administrator, 'sanctum')
            ->putJson('/api/v1/budget/monthly', [
                'month' => '2026-11',
                'total_budget' => '0.00',
            ])
            ->assertOk()
            ->assertJsonPath('data.total_budget', 0)
            ->assertJsonPath('data.remaining', 0);

        $this->assertDatabaseHas('aics_monthly_budgets', [
            'budget_month' => '2026-11',
            'total_budget' => '0.00',
        ]);
    }

    public function test_monthly_budget_cannot_be_lowered_below_the_amount_already_issued(): void
    {
        $administrator = $this->userWithRole('Administrator');
        $this->createMonthlyBudget('2026-11', '5000.00', $administrator);

        $issuedTransaction = $this->createTransaction('2026-11-20', '1250.75', $administrator);
        $issuedTransaction->forceFill([
            'guarantee_letter_issued_at' => now(),
            'guaranteed_amount' => '1250.75',
        ])->save();

        $response = $this->actingAs($administrator, 'sanctum')
            ->putJson('/api/v1/budget/monthly', [
                'month' => '2026-11',
                'total_budget' => '1250.74',
            ])
            ->assertUnprocessable();

        $this->assertStringContainsString('cannot be lower', $response->json('message'));
        $this->assertDatabaseHas('aics_monthly_budgets', [
            'budget_month' => '2026-11',
            'total_budget' => '5000.00',
            'set_by' => $administrator->id,
        ]);
    }

    public function test_senior_staff_can_issue_gl_and_the_summary_and_audit_log_are_updated(): void
    {
        $seniorStaff = $this->userWithRole('Senior staff');
        $this->createMonthlyBudget('2026-11', '5000.00', $this->userWithRole('Administrator'));
        $transaction = $this->createTransaction('2026-11-20', '1250.75', $seniorStaff);

        $this->actingAs($seniorStaff, 'sanctum')
            ->postJson('/api/v1/transactions/'.$transaction->id.'/issue-guarantee-letter')
            ->assertOk()
            ->assertJsonPath('message', 'Guarantee Letter marked as issued. Budget deducted.')
            ->assertJsonPath('data.month', '2026-11')
            ->assertJsonPath('data.total_budget', 5000)
            ->assertJsonPath('data.used', 1250.75)
            ->assertJsonPath('data.remaining', 3749.25)
            ->assertJsonPath('data.issued_count', 1);

        $transaction->refresh();
        $this->assertNotNull($transaction->guarantee_letter_issued_at);
        $this->assertSame('1250.75', $transaction->guaranteed_amount);

        $audit = TransactionAuditLog::query()
            ->where('transaction_id', $transaction->id)
            ->where('action', 'guarantee_letter_issued')
            ->sole();

        $this->assertSame($seniorStaff->id, $audit->user_id);
        $this->assertSame('2026-11', $audit->changes['month']);
        $this->assertEquals(1250.75, $audit->changes['amount']);
        $this->assertDatabaseCount('transaction_audit_logs', 1);
    }

    public function test_administrator_can_issue_a_guarantee_letter(): void
    {
        $administrator = $this->userWithRole('Administrator');
        $this->createMonthlyBudget('2026-11', '3000.00', $administrator);
        $transaction = $this->createTransaction('2026-11-20', '1000.00', $administrator);

        $this->actingAs($administrator, 'sanctum')
            ->postJson('/api/v1/transactions/'.$transaction->id.'/issue-guarantee-letter')
            ->assertOk()
            ->assertJsonPath('data.used', 1000)
            ->assertJsonPath('data.remaining', 2000);

        $this->assertNotNull($transaction->fresh()->guarantee_letter_issued_at);
        $this->assertDatabaseHas('transaction_audit_logs', [
            'transaction_id' => $transaction->id,
            'user_id' => $administrator->id,
            'action' => 'guarantee_letter_issued',
        ]);
    }

    public function test_staff_and_viewer_cannot_issue_a_guarantee_letter_or_write_an_audit_log(): void
    {
        $administrator = $this->userWithRole('Administrator');
        $this->createMonthlyBudget('2026-11', '3000.00', $administrator);
        $transaction = $this->createTransaction('2026-11-20', '1000.00', $administrator);

        foreach (['Staff', 'Viewer'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->postJson('/api/v1/transactions/'.$transaction->id.'/issue-guarantee-letter')
                ->assertForbidden();
        }

        $transaction->refresh();
        $this->assertNull($transaction->guarantee_letter_issued_at);
        $this->assertNull($transaction->guaranteed_amount);
        $this->assertDatabaseCount('transaction_audit_logs', 0);
    }

    public function test_duplicate_gl_issuance_returns_conflict_without_creating_a_second_audit_log(): void
    {
        $seniorStaff = $this->userWithRole('Senior staff');
        $this->createMonthlyBudget('2026-11', '5000.00', $this->userWithRole('Administrator'));
        $transaction = $this->createTransaction('2026-11-20', '1250.75', $seniorStaff);
        $url = '/api/v1/transactions/'.$transaction->id.'/issue-guarantee-letter';

        $this->actingAs($seniorStaff, 'sanctum')->postJson($url)->assertOk();
        $issuedAt = $transaction->fresh()->guarantee_letter_issued_at->toDateTimeString();

        $this->actingAs($seniorStaff, 'sanctum')
            ->postJson($url)
            ->assertStatus(409);

        $transaction->refresh();
        $this->assertSame($issuedAt, $transaction->guarantee_letter_issued_at->toDateTimeString());
        $this->assertSame('1250.75', $transaction->guaranteed_amount);
        $this->assertDatabaseCount('transaction_audit_logs', 1);
    }

    public function test_gl_issuance_without_a_monthly_budget_is_rejected_without_mutation(): void
    {
        $seniorStaff = $this->userWithRole('Senior staff');
        $transaction = $this->createTransaction('2026-11-20', '1000.00', $seniorStaff);

        $this->actingAs($seniorStaff, 'sanctum')
            ->postJson('/api/v1/transactions/'.$transaction->id.'/issue-guarantee-letter')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'No monthly budget has been set for 2026-11.');

        $transaction->refresh();
        $this->assertNull($transaction->guarantee_letter_issued_at);
        $this->assertNull($transaction->guaranteed_amount);
        $this->assertDatabaseCount('transaction_audit_logs', 0);
    }

    public function test_zero_and_negative_assistance_amounts_cannot_be_issued_as_gls(): void
    {
        $seniorStaff = $this->userWithRole('Senior staff');
        $this->createMonthlyBudget('2026-11', '5000.00', $this->userWithRole('Administrator'));

        foreach (['0.00', '-50.00'] as $amount) {
            $transaction = $this->createTransaction('2026-11-20', $amount, $seniorStaff);

            $this->actingAs($seniorStaff, 'sanctum')
                ->postJson('/api/v1/transactions/'.$transaction->id.'/issue-guarantee-letter')
                ->assertUnprocessable()
                ->assertJsonPath('message', 'The assistance amount must be greater than zero before issuing the Guarantee Letter.');

            $transaction->refresh();
            $this->assertNull($transaction->guarantee_letter_issued_at);
            $this->assertNull($transaction->guaranteed_amount);
        }

        $this->assertDatabaseCount('transaction_audit_logs', 0);
    }

    public function test_gl_issuance_over_the_remaining_monthly_budget_is_rejected_without_mutation(): void
    {
        $seniorStaff = $this->userWithRole('Senior staff');
        $this->createMonthlyBudget('2026-11', '1000.00', $this->userWithRole('Administrator'));
        $transaction = $this->createTransaction('2026-11-20', '1250.75', $seniorStaff);

        $response = $this->actingAs($seniorStaff, 'sanctum')
            ->postJson('/api/v1/transactions/'.$transaction->id.'/issue-guarantee-letter')
            ->assertUnprocessable();

        $this->assertStringContainsString('Insufficient monthly budget', $response->json('message'));
        $transaction->refresh();
        $this->assertNull($transaction->guarantee_letter_issued_at);
        $this->assertNull($transaction->guaranteed_amount);
        $this->assertDatabaseCount('transaction_audit_logs', 0);
        $this->assertDatabaseHas('aics_monthly_budgets', [
            'budget_month' => '2026-11',
            'total_budget' => '1000.00',
        ]);
    }

    public function test_monthly_summaries_isolate_issued_gls_across_a_calendar_year_boundary(): void
    {
        $administrator = $this->userWithRole('Administrator');
        $this->createMonthlyBudget('2026-12', '5000.00', $administrator);
        $this->createMonthlyBudget('2027-01', '4000.00', $administrator);

        $decemberTransaction = $this->createTransaction('2026-12-31', '1250.75', $administrator);
        $decemberTransaction->forceFill([
            'guarantee_letter_issued_at' => now(),
            'guaranteed_amount' => '1250.75',
        ])->save();

        $januaryTransaction = $this->createTransaction('2027-01-01', '3000.00', $administrator);
        $januaryTransaction->forceFill([
            'guarantee_letter_issued_at' => now(),
            'guaranteed_amount' => '3000.00',
        ])->save();

        $this->actingAs($this->userWithRole('Staff'), 'sanctum')
            ->getJson('/api/v1/budget/monthly?month=2026-12')
            ->assertOk()
            ->assertJsonPath('month', '2026-12')
            ->assertJsonPath('used', 1250.75)
            ->assertJsonPath('remaining', 3749.25)
            ->assertJsonPath('issued_count', 1)
            ->assertJsonPath('transactions.0.id', $decemberTransaction->id);

        $this->actingAs($this->userWithRole('Staff'), 'sanctum')
            ->getJson('/api/v1/budget/monthly?month=2027-01')
            ->assertOk()
            ->assertJsonPath('month', '2027-01')
            ->assertJsonPath('used', 3000)
            ->assertJsonPath('remaining', 1000)
            ->assertJsonPath('issued_count', 1)
            ->assertJsonPath('transactions.0.id', $januaryTransaction->id);
    }
}
