<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_cannot_set_the_monthly_budget(): void
    {
        $staff = User::factory()->withRole('Staff')->create();

        $this->actingAs($staff, 'sanctum')
            ->putJson('/api/v1/budget/monthly', [
                'month' => '2026-11',
                'total_budget' => 100000,
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'You do not have permission to perform this action.');

        $this->assertDatabaseCount('aics_monthly_budgets', 0);
    }
}
