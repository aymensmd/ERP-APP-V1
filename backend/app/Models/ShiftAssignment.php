<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class ShiftAssignment extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'user_id',
        'shift_id',
        'assignment_date',
        'start_time',
        'end_time',
        'status',
        'notes',
        'assigned_by',
    ];

    protected $casts = [
        'assignment_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function swapRequests()
    {
        return $this->hasMany(ShiftSwapRequest::class);
    }
}

