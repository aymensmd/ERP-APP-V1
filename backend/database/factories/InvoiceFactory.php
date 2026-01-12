<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition()
    {
        return [
            'company_id' => Company::factory(),
            'invoice_number' => $this->faker->unique()->numerify('INV-#####'),
            'customer_id' => Customer::factory(),
            'lead_id' => Lead::factory(),
            'issue_date' => $this->faker->date(),
            'due_date' => $this->faker->date('+1 month'),
            'status' => $this->faker->randomElement(['draft', 'sent', 'paid', 'overdue']),
            'currency' => 'USD',
            'subtotal' => $this->faker->randomFloat(2, 100, 1000),
            'tax_amount' => $this->faker->randomFloat(2, 10, 100),
            'discount_amount' => $this->faker->randomFloat(2, 0, 50),
            'total_amount' => $this->faker->randomFloat(2, 100, 1200),
            'paid_amount' => $this->faker->randomFloat(2, 0, 1200),
            'balance' => $this->faker->randomFloat(2, 0, 1200),
            'notes' => $this->faker->sentence(),
            'terms' => $this->faker->sentence(),
            'pdf_path' => null,
            'created_by' => User::factory(),
            'sent_at' => $this->faker->dateTime(),
            'paid_at' => $this->faker->dateTime(),
        ];
    }
}
