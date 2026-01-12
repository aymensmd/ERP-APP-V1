<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class InvoiceItem extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'invoice_id',
        'description',
        'quantity',
        'unit_price',
        'tax_rate',
        'discount_rate',
        'line_total',
        'position',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'line_total' => 'decimal:2',
        'position' => 'integer',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}



