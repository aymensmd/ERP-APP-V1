<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class OnboardingChecklist extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'user_id',
        'task_name',
        'description',
        'status',
        'category',
        'order',
        'due_date',
        'completed_date',
        'assigned_to',
        'completed_by',
        'notes',
    ];

    protected $casts = [
        'due_date' => 'date',
        'completed_date' => 'date',
        'order' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}



