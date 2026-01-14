<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowExecution extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'status',
        'context',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'context' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function logs()
    {
        return $this->hasMany(WorkflowLog::class, 'execution_id');
    }
}
