<?php

namespace Database\Factories;

use App\Models\EmployeeCertification;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeCertificationFactory extends Factory
{
    protected $model = EmployeeCertification::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'name' => $this->faker->word() . ' Certification',
            'issuing_organization' => $this->faker->company(),
            'certificate_number' => $this->faker->uuid(),
            'issue_date' => $this->faker->date(),
            'expiry_date' => $this->faker->date('+2 years'),
            'credential_url' => $this->faker->url(),
            'file_path' => null,
            'description' => $this->faker->sentence(),
            'does_not_expire' => $this->faker->boolean(20),
        ];
    }
}
