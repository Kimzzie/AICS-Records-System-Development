<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserFirstLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_created_user_is_required_to_change_the_temporary_password(): void
    {
        $administrator = User::factory()->withRole('Administrator')->create();

        $response = $this->actingAs($administrator, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'name' => 'Synthetic First Login Staff',
                'username' => 'synthetic-first-login',
                'password' => 'TemporaryPass123!',
                'role' => 'Staff',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.username', 'synthetic-first-login');

        $this->assertDatabaseHas('users', [
            'username' => 'synthetic-first-login',
            'role' => 'Staff',
            'status' => 'Active',
            'must_change_password' => true,
        ]);
    }

    public function test_admin_password_reset_requires_change_and_revokes_existing_sessions(): void
    {
        $administrator = User::factory()->withRole('Administrator')->create();
        $staff = User::factory()->create([
            'username' => 'existing-staff',
            'password' => Hash::make('CurrentPassword123!'),
            'must_change_password' => false,
        ]);
        $oldToken = $staff->createToken('Existing Session')->plainTextToken;
        $oldTokenSecret = explode('|', $oldToken, 2)[1];

        $this->actingAs($administrator, 'sanctum')
            ->patchJson('/api/v1/admin/users/'.$staff->id, [
                'password' => 'TemporaryReset456!',
            ])
            ->assertOk();

        $staff->refresh();

        $this->assertTrue(Hash::check('TemporaryReset456!', $staff->password));
        $this->assertTrue($staff->must_change_password);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', $oldTokenSecret),
        ]);
    }
}
