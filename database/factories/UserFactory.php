<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = \App\Models\User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('TestPassword123!'),
            'role' => 'Staff',
            'status' => 'Active',
            'must_change_password' => false,
            'last_login_at' => null,
        ];
    }

    public function disabled(): static
    {
        return $this->state(fn () => ['status' => 'Inactive']);
    }

    public function withRole(string $role): static
    {
        return $this->state(fn () => ['role' => $role]);
    }
}
