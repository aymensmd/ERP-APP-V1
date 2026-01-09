<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Customer extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'lead_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'company_name',
        'job_title',
        'industry',
        'type',
        'status',
        'tax_id',
        'billing_address',
        'shipping_address',
        'website',
        'credit_limit',
        'total_revenue',
        'total_orders',
        'first_contact_date',
        'last_contact_date',
        'notes',
        'custom_fields',
        'assigned_to',
        'created_by',
    ];

    protected $casts = [
        'custom_fields' => 'array',
        'credit_limit' => 'decimal:2',
        'total_revenue' => 'decimal:2',
        'total_orders' => 'integer',
        'first_contact_date' => 'date',
        'last_contact_date' => 'date',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function communications()
    {
        return $this->morphMany(Communication::class, 'communicable');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}



