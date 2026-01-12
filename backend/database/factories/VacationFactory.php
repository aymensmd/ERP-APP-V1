<?php

namespace Database\Factories;

use App\Models\Vacation;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class VacationFactory extends Factory
{
    protected $model = Vacation::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement(['annual', 'sick', 'unpaid']),
            'start_date' => $this->faker->date(),
            'end_date' => $this->faker->date('+1 week'),
            'reason' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'approved_by' => User::factory(),
            'approved_at' => $this->faker->dateTime(),
            'rejection_reason' => $this->faker->optional()->sentence(),
            'company_id' => Company::factory(),
        ];
    }
}
