<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Models\WorkflowEdge;
use App\Models\WorkflowExecution;
use App\Models\WorkflowVersion;
use App\Jobs\RunWorkflowExecution;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class WorkflowController extends Controller
{
    public function index(Request $request)
    {
        $workflows = Workflow::query()
            ->select('id', 'name', 'description', 'status', 'version', 'created_by', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($workflows);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');

        $workflow = Workflow::create([
            'company_id' => $companyId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'status' => 'draft',
            'version' => 1,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($workflow, 201);
    }

    public function show(Workflow $workflow)
    {
        $workflow->load(['nodes', 'edges']);
        return response()->json($workflow);
    }

    public function update(Request $request, Workflow $workflow)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:draft,published',
        ]);

        $workflow->update($data);
        return response()->json($workflow);
    }

    public function destroy(Workflow $workflow)
    {
        $workflow->delete();
        return response()->json(['success' => true]);
    }

    public function saveGraph(Request $request, Workflow $workflow)
    {
        $payload = $request->validate([
            'nodes' => 'required|array',
            'edges' => 'required|array',
        ]);

        DB::transaction(function () use ($workflow, $payload) {
            WorkflowNode::where('workflow_id', $workflow->id)->delete();
            WorkflowEdge::where('workflow_id', $workflow->id)->delete();

            foreach ($payload['nodes'] as $n) {
                WorkflowNode::create([
                    'id' => $n['id'] ?? Str::uuid()->toString(),
                    'workflow_id' => $workflow->id,
                    'type' => $n['data']['type'],
                    'name' => $n['data']['label'] ?? ($n['data']['type'] . '_' . substr(Str::uuid()->toString(), 0, 6)),
                    'settings' => $n['data']['settings'] ?? [],
                    'position_x' => $n['position']['x'] ?? 0,
                    'position_y' => $n['position']['y'] ?? 0,
                ]);
            }

            foreach ($payload['edges'] as $e) {
                WorkflowEdge::create([
                    'workflow_id' => $workflow->id,
                    'source_node_id' => $e['source'],
                    'target_node_id' => $e['target'],
                    'label' => $e['label'] ?? null,
                    'settings' => $e['data']['settings'] ?? [],
                ]);
            }
        });

        return response()->json(['success' => true]);
    }

    public function run(Request $request, Workflow $workflow)
    {
        if ($workflow->status !== 'published') {
            return response()->json(['error' => 'Workflow must be published to run'], 422);
        }

        $execution = WorkflowExecution::create([
            'workflow_id' => $workflow->id,
            'status' => 'pending',
            'context' => $request->input('context', []),
            'started_at' => now(),
        ]);

        RunWorkflowExecution::dispatch($execution->id)->onQueue('default');

        return response()->json(['execution_id' => $execution->id, 'status' => 'queued']);
    }

    public function publish(Request $request, Workflow $workflow)
    {
        $nodes = WorkflowNode::where('workflow_id', $workflow->id)->get();
        $edges = WorkflowEdge::where('workflow_id', $workflow->id)->get();

        $nextVersion = ($workflow->version ?? 0) + 1;

        DB::transaction(function () use ($workflow, $nodes, $edges, $nextVersion) {
            $workflow->update(['status' => 'published', 'version' => $nextVersion]);
            WorkflowVersion::create([
                'workflow_id' => $workflow->id,
                'version' => $nextVersion,
                'status' => 'published',
                'graph' => [
                    'nodes' => $nodes->map(function ($n) {
                        return [
                            'id' => $n->id,
                            'type' => $n->type,
                            'name' => $n->name,
                            'settings' => $n->settings,
                            'position_x' => $n->position_x,
                            'position_y' => $n->position_y,
                        ];
                    })->toArray(),
                    'edges' => $edges->map(function ($e) {
                        return [
                            'id' => $e->id,
                            'source_node_id' => $e->source_node_id,
                            'target_node_id' => $e->target_node_id,
                            'label' => $e->label,
                            'settings' => $e->settings,
                        ];
                    })->toArray(),
                ],
            ]);
        });

        return response()->json(['status' => 'published', 'version' => $nextVersion]);
    }

    public function unpublish(Request $request, Workflow $workflow)
    {
        if ($workflow->status === 'draft') {
            return response()->json(['status' => 'draft']);
        }
        $workflow->update(['status' => 'draft']);
        return response()->json(['status' => 'draft']);
    }

    public function versions(Workflow $workflow)
    {
        $versions = WorkflowVersion::where('workflow_id', $workflow->id)
            ->orderByDesc('version')
            ->get(['id', 'version', 'status', 'created_at']);
        return response()->json($versions);
    }

    public function versionShow(Workflow $workflow, $version)
    {
        $record = WorkflowVersion::where('workflow_id', $workflow->id)
            ->where('version', (int)$version)
            ->firstOrFail();
        return response()->json($record);
    }

    public function rollback(Request $request, Workflow $workflow, $version)
    {
        $record = WorkflowVersion::where('workflow_id', $workflow->id)
            ->where('version', (int)$version)
            ->firstOrFail();

        DB::transaction(function () use ($workflow, $record) {
            WorkflowNode::where('workflow_id', $workflow->id)->delete();
            WorkflowEdge::where('workflow_id', $workflow->id)->delete();

            foreach ($record->graph['nodes'] as $n) {
                WorkflowNode::create([
                    'id' => $n['id'],
                    'workflow_id' => $workflow->id,
                    'type' => $n['type'],
                    'name' => $n['name'],
                    'settings' => $n['settings'] ?? [],
                    'position_x' => $n['position_x'] ?? 0,
                    'position_y' => $n['position_y'] ?? 0,
                ]);
            }

            foreach ($record->graph['edges'] as $e) {
                WorkflowEdge::create([
                    'workflow_id' => $workflow->id,
                    'source_node_id' => $e['source_node_id'],
                    'target_node_id' => $e['target_node_id'],
                    'label' => $e['label'] ?? null,
                    'settings' => $e['settings'] ?? [],
                ]);
            }
        });

        return response()->json(['success' => true, 'rolled_back_to' => (int)$version]);
    }
}
