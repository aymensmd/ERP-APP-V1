<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'invoice_id' => Invoice::factory(),
            'amount' => $this->faker->randomFloat(2, 100, 1000),
            'payment_date' => $this->faker->date(),
            'payment_method' => $this->faker->randomElement(['cash', 'credit_card', 'bank_transfer']),
            'reference_number' => $this->faker->uuid(),
            'notes' => $this->faker->sentence(),
            'received_by' => User::factory(),
        ];
    }
}
