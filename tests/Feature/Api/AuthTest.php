<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_log_in_and_receives_only_safe_user_fields(): void
    {
        $user = User::factory()->create([
            'username' => 'test.staff',
            'password' => Hash::make('TestPassword123!'),
            'role' => 'Staff',
            'status' => 'Active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'test.staff',
            'password' => 'TestPassword123!',
            'device_name' => 'PHPUnit',
        ]);

        $response->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.username', 'test.staff')
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.email')
            ->assertJsonStructure(['token', 'token_type', 'user' => [
                'id', 'name', 'username', 'role', 'status', 'must_change_password',
            ]]);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_invalid_credentials_are_rejected(): void
    {
        User::factory()->create([
            'username' => 'test.staff',
            'password' => Hash::make('TestPassword123!'),
            'status' => 'Active',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'username' => 'test.staff',
            'password' => 'WrongPassword!',
        ])->assertUnprocessable()->assertJsonValidationErrors('username');
    }

    public function test_disabled_user_cannot_log_in(): void
    {
        User::factory()->disabled()->create([
            'username' => 'test.disabled',
            'password' => Hash::make('TestPassword123!'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'username' => 'test.disabled',
            'password' => 'TestPassword123!',
        ])->assertUnprocessable()->assertJsonValidationErrors('username');
    }

    public function test_auth_me_rejects_unauthenticated_requests(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_authenticated_user_can_read_safe_identity_payload(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.email');
    }

    public function test_logout_revokes_the_current_access_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('PHPUnit')->plainTextToken;
        $tokenSecret = explode('|', $token, 2)[1];

        $this->withToken($token)->postJson('/api/v1/auth/logout')
            ->assertOk()->assertJsonPath('message', 'Logged out.');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', $tokenSecret),
        ]);
    }
}
