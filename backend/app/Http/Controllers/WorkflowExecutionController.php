<?php

namespace App\Http\Controllers;

use App\Models\WorkflowExecution;
use App\Models\WorkflowLog;
use Illuminate\Http\Request;

class WorkflowExecutionController extends Controller
{
    public function show(WorkflowExecution $execution)
    {
        return response()->json([
            'id' => $execution->id,
            'workflow_id' => $execution->workflow_id,
            'status' => $execution->status,
            'context' => $execution->context,
            'started_at' => $execution->started_at,
            'ended_at' => $execution->ended_at,
        ]);
    }

    public function logs(WorkflowExecution $execution)
    {
        $logs = WorkflowLog::where('execution_id', $execution->id)
            ->orderBy('created_at', 'asc')
            ->get(['id', 'node_id', 'type', 'message', 'data', 'created_at']);
        return response()->json(['logs' => $logs]);
    }
}

