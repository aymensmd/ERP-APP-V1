<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class KanbanTask extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'board_id',
        'title',
        'description',
        'status',
        'position',
        'priority',
        'due_date',
        'assigned_to',
        'created_by',
        'tags',
        'estimated_hours',
        'actual_hours',
    ];

    protected $casts = [
        'tags' => 'array',
        'due_date' => 'date',
        'position' => 'integer',
        'estimated_hours' => 'integer',
        'actual_hours' => 'integer',
    ];

    public function board()
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function dependencies()
    {
        return $this->hasMany(TaskDependency::class, 'task_id');
    }

    public function blockingTasks()
    {
        return $this->hasMany(TaskDependency::class, 'depends_on_task_id');
    }

    public function isOverdue()
    {
        return $this->due_date && $this->due_date->isPast() && $this->status !== 'done';
    }
}




