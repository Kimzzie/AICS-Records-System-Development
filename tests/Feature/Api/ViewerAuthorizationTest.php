<?php

namespace Tests\Feature\Api;

use App\Models\AicsTransaction;
use App\Models\Beneficiary;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ViewerAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewer_cannot_read_operational_data_or_drafts(): void
    {
        $viewer = User::factory()->withRole('Viewer')->create();
        $client = Client::create([
            'last_name' => 'Sample',
            'first_name' => 'Client',
            'full_name' => 'Sample Client',
        ]);
        $beneficiary = Beneficiary::create([
            'last_name' => 'Sample',
            'first_name' => 'Beneficiary',
            'full_name' => 'Sample Beneficiary',
        ]);
        $transaction = AicsTransaction::create([
            'gl_number' => '0001-2026',
            'transaction_date' => now()->toDateString(),
            'client_id' => $client->id,
            'beneficiary_id' => $beneficiary->id,
        ]);
        $draft = $viewer->transactionDrafts()->create([
            'form_data' => ['step' => 1],
        ]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/v1/lookups')
            ->assertForbidden();

        $this->getJson('/api/v1/transactions')->assertForbidden();
        $this->getJson('/api/v1/transactions/search?q=Sample')->assertForbidden();
        $this->getJson('/api/v1/transactions/'.$transaction->id)->assertForbidden();
        $this->getJson('/api/v1/drafts')->assertForbidden();

        $this->postJson('/api/v1/drafts', [
            'client_name' => 'Viewer Draft',
            'form_data' => ['step' => 1],
        ])->assertForbidden();

        $this->deleteJson('/api/v1/drafts/'.$draft->id)->assertForbidden();

        $this->getJson('/api/v1/beneficiaries/history')->assertForbidden();
        $this->getJson('/api/v1/beneficiaries/eligibility')->assertForbidden();
        $this->getJson('/api/v1/budget/monthly')->assertForbidden();
        $this->putJson('/api/v1/budget/monthly', [
            'month' => '2026-11',
            'total_budget' => 100000,
        ])->assertForbidden();
        $this->getJson('/api/v1/reports/monthly')->assertForbidden();
        $this->getJson('/api/v1/admin/users')->assertForbidden();

        $this->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_viewer_can_login_change_password_and_logout(): void
    {
        $viewer = User::factory()->withRole('Viewer')->create([
            'username' => 'viewer-auth-flow',
            'password' => 'TemporaryPass123!',
            'must_change_password' => true,
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'username' => $viewer->username,
            'password' => 'TemporaryPass123!',
        ])->assertOk()
            ->assertJsonPath('user.role', 'Viewer')
            ->assertJsonPath('user.must_change_password', true);

        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'Viewer');

        $this->withToken($token)->putJson('/api/v1/auth/password', [
            'current_password' => 'TemporaryPass123!',
            'password' => 'NewViewerPassword456!',
            'password_confirmation' => 'NewViewerPassword456!',
        ])->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();

        $newLogin = $this->postJson('/api/v1/auth/login', [
            'username' => $viewer->username,
            'password' => 'NewViewerPassword456!',
        ])->assertOk();

        $this->withToken($newLogin->json('token'))
            ->postJson('/api/v1/auth/logout')
            ->assertOk();
    }

    public function test_staff_retains_operational_read_access(): void
    {
        $staff = User::factory()->withRole('Staff')->create();

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/lookups')
            ->assertOk();

        $this->getJson('/api/v1/transactions')->assertOk();
        $this->getJson('/api/v1/transactions/search?q=Sample')->assertOk();
        $this->getJson('/api/v1/drafts')->assertOk();
    }
}
