<?php

namespace Database\Factories;

use App\Models\EmployeeSkill;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeSkillFactory extends Factory
{
    protected $model = EmployeeSkill::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'skill_name' => $this->faker->word(),
            'category' => $this->faker->word(),
            'proficiency' => $this->faker->randomElement(['beginner', 'intermediate', 'advanced']),
            'years_of_experience' => $this->faker->numberBetween(1, 20),
            'acquired_date' => $this->faker->date(),
            'description' => $this->faker->sentence(),
        ];
    }
}
