<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition()
    {
        return [
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'start_date' => $this->faker->dateTimeBetween('-1 month', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 day', '+2 months'),
            'location' => $this->faker->address(),
            'created_by' => User::factory(),
            'company_id' => Company::factory(),
        ];
    }
}
