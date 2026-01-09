<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Lead extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'company_name',
        'job_title',
        'industry',
        'status',
        'source',
        'score',
        'estimated_value',
        'notes',
        'assigned_to',
        'created_by',
        'contacted_at',
        'converted_at',
    ];

    protected $casts = [
        'score' => 'integer',
        'estimated_value' => 'decimal:2',
        'contacted_at' => 'datetime',
        'converted_at' => 'datetime',
    ];

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

    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }
}


