<?php

namespace Database\Factories;

use App\Models\OnboardingChecklist;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OnboardingChecklistFactory extends Factory
{
    protected $model = OnboardingChecklist::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'task_name' => $this->faker->sentence(3),
            'description' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['pending', 'completed']),
            'category' => $this->faker->word(),
            'order' => $this->faker->numberBetween(1, 10),
            'due_date' => $this->faker->date(),
            'completed_date' => $this->faker->date(),
            'assigned_to' => User::factory(),
            'completed_by' => User::factory(),
            'notes' => $this->faker->sentence(),
        ];
    }
}
