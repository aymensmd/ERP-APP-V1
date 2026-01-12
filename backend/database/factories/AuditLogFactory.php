<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'model_type' => 'App\\Models\\User',
            'model_id' => User::factory(),
            'action' => $this->faker->randomElement(['created', 'updated', 'deleted']),
            'old_values' => ['field' => 'old'],
            'new_values' => ['field' => 'new'],
            'changes' => ['field' => 'changed'],
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'url' => $this->faker->url(),
            'method' => $this->faker->randomElement(['GET', 'POST', 'PUT', 'DELETE']),
        ];
    }
}
