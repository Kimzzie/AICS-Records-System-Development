<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountStatusEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_disabled_user_with_existing_token_cannot_access_authenticated_routes(): void
    {
        $user = User::factory()->create(['status' => 'Disabled']);
        $token = $user->createToken('Existing Disabled Session')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertForbidden()
            ->assertJsonPath('message', 'Your account is disabled. Contact an administrator.');
    }

    public function test_disabling_user_revokes_all_existing_sanctum_tokens(): void
    {
        $administrator = User::factory()->withRole('Administrator')->create();
        $administratorToken = $administrator->createToken('Administrator Session')->plainTextToken;

        $target = User::factory()->create([
            'username' => 'disabled-target',
            'status' => 'Active',
        ]);
        $firstToken = $target->createToken('Desktop Session')->plainTextToken;
        $secondToken = $target->createToken('Browser Session')->plainTextToken;

        $this->withToken($administratorToken)
            ->patchJson('/api/v1/admin/users/'.$target->id, ['status' => 'Disabled'])
            ->assertOk();

        $target->refresh();

        $this->assertSame('Disabled', $target->status);
        $this->assertSame(0, $target->tokens()->count());

        $this->app['auth']->forgetGuards();
        $this->withToken($firstToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();

        $this->app['auth']->forgetGuards();
        $this->withToken($secondToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }
}
