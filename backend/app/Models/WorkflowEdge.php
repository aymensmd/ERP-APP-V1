<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowEdge extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'source_node_id',
        'target_node_id',
        'label',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function sourceNode()
    {
        return $this->belongsTo(WorkflowNode::class, 'source_node_id', 'id');
    }

    public function targetNode()
    {
        return $this->belongsTo(WorkflowNode::class, 'target_node_id', 'id');
    }
}
