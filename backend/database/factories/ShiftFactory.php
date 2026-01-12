<?php

namespace Database\Factories;

use App\Models\Shift;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'name' => $this->faker->word() . ' Shift',
            'start_time' => $this->faker->time('H:i:s'),
            'end_time' => $this->faker->time('H:i:s'),
            'duration_hours' => $this->faker->numberBetween(1, 12),
            'description' => $this->faker->sentence(),
            'days_of_week' => [$this->faker->dayOfWeek()],
            'is_active' => $this->faker->boolean(80),
        ];
    }
}
