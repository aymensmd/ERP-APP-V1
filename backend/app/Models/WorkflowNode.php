<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowNode extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'workflow_id',
        'type',
        'name',
        'settings',
        'position_x',
        'position_y',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function outgoingEdges()
    {
        return $this->hasMany(WorkflowEdge::class, 'source_node_id', 'id');
    }

    public function incomingEdges()
    {
        return $this->hasMany(WorkflowEdge::class, 'target_node_id', 'id');
    }
}
