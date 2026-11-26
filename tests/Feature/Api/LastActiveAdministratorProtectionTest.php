<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LastActiveAdministratorProtectionTest extends TestCase
{
    use RefreshDatabase;

    private const PROTECTION_MESSAGE = 'The last active administrator cannot be disabled or demoted.';

    public function test_last_active_administrator_cannot_be_demoted(): void
    {
        $administrator = User::factory()->withRole('Administrator')->create();

        $this->actingAs($administrator, 'sanctum')
            ->patchJson('/api/v1/admin/users/'.$administrator->id, ['role' => 'Staff'])
            ->assertUnprocessable()
            ->assertJsonPath('message', self::PROTECTION_MESSAGE);

        $this->assertDatabaseHas('users', [
            'id' => $administrator->id,
            'role' => 'Administrator',
            'status' => 'Active',
        ]);
    }

    public function test_last_active_administrator_cannot_be_disabled(): void
    {
        $administrator = User::factory()->withRole('Administrator')->create();

        $this->actingAs($administrator, 'sanctum')
            ->patchJson('/api/v1/admin/users/'.$administrator->id, ['status' => 'Disabled'])
            ->assertUnprocessable()
            ->assertJsonPath('message', self::PROTECTION_MESSAGE);

        $this->assertDatabaseHas('users', [
            'id' => $administrator->id,
            'role' => 'Administrator',
            'status' => 'Active',
        ]);
    }

    public function test_last_active_administrator_cannot_be_demoted_and_disabled_in_one_update(): void
    {
        $administrator = User::factory()->withRole('Administrator')->create();

        $this->actingAs($administrator, 'sanctum')
            ->patchJson('/api/v1/admin/users/'.$administrator->id, [
                'role' => 'Staff',
                'status' => 'Disabled',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', self::PROTECTION_MESSAGE);

        $this->assertDatabaseHas('users', [
            'id' => $administrator->id,
            'role' => 'Administrator',
            'status' => 'Active',
        ]);
    }

    public function test_administrator_can_be_demoted_when_another_active_administrator_remains(): void
    {
        $actingAdministrator = User::factory()->withRole('Administrator')->create();
        $targetAdministrator = User::factory()->withRole('Administrator')->create();

        $this->actingAs($actingAdministrator, 'sanctum')
            ->patchJson('/api/v1/admin/users/'.$targetAdministrator->id, ['role' => 'Staff'])
            ->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $targetAdministrator->id,
            'role' => 'Staff',
            'status' => 'Active',
        ]);
        $this->assertSame(
            1,
            User::where('role', 'Administrator')->where('status', 'Active')->count()
        );
    }

    public function test_administrator_can_delete_another_administrator_when_one_active_administrator_remains(): void
    {
        $actingAdministrator = User::factory()->withRole('Administrator')->create();
        $targetAdministrator = User::factory()->withRole('Administrator')->create();

        $this->actingAs($actingAdministrator, 'sanctum')
            ->deleteJson('/api/v1/admin/users/'.$targetAdministrator->id)
            ->assertOk()
            ->assertJsonPath('message', 'User deleted.');

        $this->assertDatabaseMissing('users', ['id' => $targetAdministrator->id]);
        $this->assertSame(
            1,
            User::where('role', 'Administrator')->where('status', 'Active')->count()
        );
    }

    public function test_administrator_can_delete_staff_without_removing_last_active_administrator(): void
    {
        $administrator = User::factory()->withRole('Administrator')->create();
        $staff = User::factory()->withRole('Staff')->create();

        $this->actingAs($administrator, 'sanctum')
            ->deleteJson('/api/v1/admin/users/'.$staff->id)
            ->assertOk()
            ->assertJsonPath('message', 'User deleted.');

        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
        $this->assertSame(
            1,
            User::where('role', 'Administrator')->where('status', 'Active')->count()
        );
    }
}
