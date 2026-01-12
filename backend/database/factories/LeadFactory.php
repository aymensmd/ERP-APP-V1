<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'company_name' => $this->faker->company(),
            'job_title' => $this->faker->jobTitle(),
            'industry' => $this->faker->word(),
            'status' => $this->faker->randomElement(['new', 'contacted', 'qualified', 'lost']),
            'source' => $this->faker->word(),
            'score' => $this->faker->numberBetween(1, 100),
            'estimated_value' => $this->faker->randomFloat(2, 1000, 10000),
            'notes' => $this->faker->sentence(),
            'assigned_to' => User::factory(),
            'created_by' => User::factory(),
            'contacted_at' => $this->faker->dateTime(),
            'converted_at' => $this->faker->dateTime(),
        ];
    }
}
