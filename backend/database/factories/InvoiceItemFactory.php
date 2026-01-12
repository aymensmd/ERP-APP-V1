<?php

namespace Database\Factories;

use App\Models\InvoiceItem;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceItemFactory extends Factory
{
    protected $model = InvoiceItem::class;

    public function definition()
    {
        return [
            'invoice_id' => Invoice::factory(),
            'description' => $this->faker->sentence(),
            'quantity' => $this->faker->numberBetween(1, 10),
            'unit_price' => $this->faker->randomFloat(2, 10, 200),
            'tax_rate' => $this->faker->randomFloat(2, 0, 0.2),
            'discount_rate' => $this->faker->randomFloat(2, 0, 0.1),
            'line_total' => $this->faker->randomFloat(2, 10, 2000),
            'position' => $this->faker->numberBetween(1, 10),
        ];
    }
}
