<?php

namespace Database\Factories;

use App\Models\ShiftAssignment;
use App\Models\Company;
use App\Models\User;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShiftAssignmentFactory extends Factory
{
    protected $model = ShiftAssignment::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'shift_id' => Shift::factory(),
            'assignment_date' => $this->faker->date(),
            'start_time' => $this->faker->time('H:i:s'),
            'end_time' => $this->faker->time('H:i:s'),
            'status' => $this->faker->randomElement(['assigned', 'completed', 'missed']),
            'notes' => $this->faker->sentence(),
            'assigned_by' => User::factory(),
        ];
    }
}
