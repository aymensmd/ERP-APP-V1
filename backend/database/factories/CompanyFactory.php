<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition()
    {
        $name = $this->faker->company();
        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . $this->faker->unique()->randomNumber(3),
            'domain' => $this->faker->domainName(),
            'email' => $this->faker->companyEmail(),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'logo' => null,
            'settings' => [],
            'subscription_plan' => 'basic',
            'subscription_status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'subscription_ends_at' => now()->addYear(),
            'timezone' => 'UTC',
            'currency' => 'USD',
            'language' => 'en',
            'is_active' => true,
        ];
    }
}
