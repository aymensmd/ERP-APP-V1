<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class TaskDependency extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'task_id',
        'depends_on_task_id',
        'type',
    ];

    public function task()
    {
        return $this->belongsTo(KanbanTask::class, 'task_id');
    }

    public function dependsOn()
    {
        return $this->belongsTo(KanbanTask::class, 'depends_on_task_id');
    }
}




