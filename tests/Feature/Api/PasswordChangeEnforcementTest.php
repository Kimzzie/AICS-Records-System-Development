<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordChangeEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_pending_password_change_cannot_access_application_api_routes(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);
        $token = $user->createToken('PHPUnit')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/lookups')
            ->assertForbidden()
            ->assertJsonPath('message', 'You must change your password before accessing the system.');
    }

    public function test_pending_user_can_read_auth_me_and_see_password_change_flag(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.must_change_password', true);
    }

    public function test_pending_user_can_change_password_and_all_existing_tokens_are_revoked(): void
    {
        $user = User::factory()->create([
            'must_change_password' => true,
            'password' => Hash::make('TemporaryPass123!'),
        ]);
        $token = $user->createToken('PHPUnit')->plainTextToken;
        $tokenSecret = explode('|', $token, 2)[1];

        $this->withToken($token)
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'TemporaryPass123!',
                'password' => 'MyNewPassword456!',
                'password_confirmation' => 'MyNewPassword456!',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Password changed. Please log in again.');

        $user->refresh();

        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('MyNewPassword456!', $user->password));
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', $tokenSecret),
        ]);
    }

    public function test_pending_user_can_logout_without_changing_password(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out.');
    }
}
