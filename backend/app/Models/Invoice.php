<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Invoice extends Model
{
    use HasFactory, HasCompany, Auditable, \App\Traits\HasAuthorization;

    protected $fillable = [
        'company_id',
        'invoice_number',
        'customer_id',
        'lead_id',
        'issue_date',
        'due_date',
        'status',
        'currency',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'balance',
        'notes',
        'terms',
        'pdf_path',
        'created_by',
        'sent_at',
        'paid_at',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function isOverdue()
    {
        return $this->status !== 'paid' && 
               $this->due_date && 
               $this->due_date->isPast();
    }

    public function isFullyPaid()
    {
        return $this->paid_amount >= $this->total_amount;
    }
}



