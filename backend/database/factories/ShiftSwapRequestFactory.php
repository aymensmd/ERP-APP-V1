<?php

namespace Database\Factories;

use App\Models\ShiftSwapRequest;
use App\Models\Company;
use App\Models\ShiftAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShiftSwapRequestFactory extends Factory
{
    protected $model = ShiftSwapRequest::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'shift_assignment_id' => ShiftAssignment::factory(),
            'requested_by' => User::factory(),
            'requested_to' => User::factory(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected']),
            'reason' => $this->faker->sentence(),
            'response_note' => $this->faker->sentence(),
            'responded_at' => $this->faker->dateTime(),
        ];
    }
}
