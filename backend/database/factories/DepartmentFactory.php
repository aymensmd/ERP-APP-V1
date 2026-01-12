<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

    public function definition()
    {
        $name = $this->faker->unique()->word() . ' Department';
        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . $this->faker->unique()->randomNumber(3),
            'description' => $this->faker->sentence(),
            'company_id' => Company::factory(),
        ];
    }
}
