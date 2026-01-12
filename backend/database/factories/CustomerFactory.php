<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'lead_id' => null,
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'company_name' => $this->faker->company(),
            'job_title' => $this->faker->jobTitle(),
            'industry' => $this->faker->word(),
            'type' => $this->faker->randomElement(['lead', 'client']),
            'status' => $this->faker->randomElement(['active', 'inactive']),
            'tax_id' => $this->faker->uuid(),
            'billing_address' => $this->faker->address(),
            'shipping_address' => $this->faker->address(),
            'website' => $this->faker->url(),
            'credit_limit' => $this->faker->randomFloat(2, 1000, 10000),
            'total_revenue' => $this->faker->randomFloat(2, 1000, 100000),
            'total_orders' => $this->faker->numberBetween(1, 20),
            'first_contact_date' => $this->faker->date(),
            'last_contact_date' => $this->faker->date(),
            'notes' => $this->faker->sentence(),
            'custom_fields' => [],
            'assigned_to' => null,
            'created_by' => null,
        ];
    }
}
