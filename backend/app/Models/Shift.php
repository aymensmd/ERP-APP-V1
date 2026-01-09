<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Shift extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'name',
        'start_time',
        'end_time',
        'duration_hours',
        'description',
        'days_of_week',
        'is_active',
    ];

    protected $casts = [
        'duration_hours' => 'integer',
        'days_of_week' => 'array',
        'is_active' => 'boolean',
    ];

    public function assignments()
    {
        return $this->hasMany(ShiftAssignment::class);
    }
}

