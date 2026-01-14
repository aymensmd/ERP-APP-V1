<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'execution_id',
        'node_id',
        'type',
        'message',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function execution()
    {
        return $this->belongsTo(WorkflowExecution::class);
    }

    public function node()
    {
        return $this->belongsTo(WorkflowNode::class, 'node_id', 'id');
    }
}
