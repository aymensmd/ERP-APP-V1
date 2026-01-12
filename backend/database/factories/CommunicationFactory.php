<?php

namespace Database\Factories;

use App\Models\Communication;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommunicationFactory extends Factory
{
    protected $model = Communication::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'communicable_type' => 'App\\Models\\User',
            'communicable_id' => User::factory(),
            'type' => $this->faker->randomElement(['email', 'call', 'meeting']),
            'subject' => $this->faker->sentence(),
            'content' => $this->faker->paragraph(),
            'direction' => $this->faker->randomElement(['inbound', 'outbound']),
            'user_id' => User::factory(),
            'scheduled_at' => $this->faker->dateTimeBetween('-1 week', '+1 week'),
            'completed_at' => $this->faker->dateTimeBetween('-1 week', '+1 week'),
            'status' => $this->faker->randomElement(['pending', 'completed']),
            'duration_minutes' => $this->faker->numberBetween(1, 120),
            'attachments' => [],
            'metadata' => [],
        ];
    }
}
