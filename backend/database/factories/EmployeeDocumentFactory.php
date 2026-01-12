<?php

namespace Database\Factories;

use App\Models\EmployeeDocument;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeDocumentFactory extends Factory
{
    protected $model = EmployeeDocument::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'name' => $this->faker->word() . ' Document',
            'type' => $this->faker->randomElement(['pdf', 'doc', 'image']),
            'file_path' => null,
            'file_name' => $this->faker->word() . '.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => $this->faker->numberBetween(1000, 1000000),
            'expiry_date' => $this->faker->date('+2 years'),
            'description' => $this->faker->sentence(),
            'is_confidential' => $this->faker->boolean(10),
        ];
    }
}
