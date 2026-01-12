<?php

namespace Database\Factories;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;

class PermissionFactory extends Factory
{
    protected $model = Permission::class;

    public function definition()
    {
        return [
            'name' => $this->faker->unique()->word() . '.view',
            'resource' => $this->faker->word(),
            'action' => 'view',
            'description' => $this->faker->sentence(),
            'group' => $this->faker->word(),
            'sort_order' => $this->faker->numberBetween(1, 100),
        ];
    }
}
