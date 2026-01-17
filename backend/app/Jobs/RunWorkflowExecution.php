<?php

namespace App\Jobs;

use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Models\WorkflowEdge;
use App\Models\WorkflowExecution;
use App\Models\WorkflowLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class RunWorkflowExecution implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $executionId;

    public function __construct(int $executionId)
    {
        $this->executionId = $executionId;
    }

    public function handle(): void
    {
        $execution = WorkflowExecution::find($this->executionId);
        if (!$execution) {
            return;
        }

        $execution->update(['status' => 'running', 'started_at' => now()]);

        $workflow = Workflow::with(['nodes', 'edges'])->find($execution->workflow_id);
        if (!$workflow) {
            $execution->update(['status' => 'failed', 'ended_at' => now()]);
            return;
        }

        $nodes = $workflow->nodes->keyBy('id');
        $edges = $workflow->edges;

        $trigger = $workflow->nodes->firstWhere('type', 'trigger');
        if (!$trigger) {
            $execution->update(['status' => 'failed', 'ended_at' => now()]);
            return;
        }

        $visited = [];
        $outputs = [];

        $resolveExpr = function ($expr) use (&$outputs, $execution) {
            if (!is_string($expr)) return $expr;
            return preg_replace_callback('/\{\{\s*context\.outputs\.([^.]+)\.([^\}]+)\s*\}\}/', function ($m) use (&$outputs) {
                $nodeId = $m[1];
                $key = $m[2];
                return $outputs[$nodeId][$key] ?? '';
            }, $expr);
        };

        $processNode = function (string $nodeId) use (&$processNode, &$visited, &$outputs, $resolveExpr, $execution, $nodes, $edges) {
            if (isset($visited[$nodeId])) {
                return;
            }
            $visited[$nodeId] = true;

            $node = $nodes->get($nodeId);
            if (!$node) {
                return;
            }

            $outgoing = $edges->where('source_node_id', $nodeId)->values();

            if ($node->type === 'http') {
                $method = strtoupper($node->settings['method'] ?? 'GET');
                $url = $resolveExpr($node->settings['url'] ?? '');
                $headers = [];
                if (!empty($node->settings['headers'])) {
                    try {
                        $headers = is_array($node->settings['headers'])
                            ? $node->settings['headers']
                            : ((json_decode($node->settings['headers'], true) ?? []));
                    } catch (\Throwable $e) {
                        $headers = [];
                    }
                }
                $body = $node->settings['body'] ?? null;
                $resp = null;
                try {
                    if ($method === 'POST') {
                        $resp = Http::withHeaders($headers)->post(
                            $url,
                            is_string($body) ? ((json_decode($body, true) ?? [])) : $body
                        );
                    } else {
                        $resp = Http::withHeaders($headers)->get($url);
                    }
                    $outputs[$nodeId] = [
                        'response' => $resp->json(),
                        'status' => $resp->status(),
                        'headers' => $resp->headers(),
                    ];
                    WorkflowLog::create([
                        'execution_id' => $execution->id,
                        'node_id' => $nodeId,
                        'type' => 'success',
                        'message' => 'HTTP request executed',
                        'data' => ['status' => $resp->status()],
                    ]);
                } catch (\Throwable $e) {
                    WorkflowLog::create([
                        'execution_id' => $execution->id,
                        'node_id' => $nodeId,
                        'type' => 'error',
                        'message' => 'HTTP request failed',
                        'data' => ['error' => $e->getMessage()],
                    ]);
                }
            } elseif ($node->type === 'condition') {
                $left = $resolveExpr($node->settings['leftSide'] ?? '');
                $right = $resolveExpr($node->settings['rightSide'] ?? '');
                $op = $node->settings['operator'] ?? 'eq';
                $result = false;
                $a = is_numeric($left) ? (float)$left : $left;
                $b = is_numeric($right) ? (float)$right : $right;
                switch ($op) {
                    case 'eq': $result = $a == $b; break;
                    case 'neq': $result = $a != $b; break;
                    case 'gt': $result = $a > $b; break;
                    case 'gte': $result = $a >= $b; break;
                    case 'lt': $result = $a < $b; break;
                    case 'lte': $result = $a <= $b; break;
                    case 'contains': $result = is_string($a) && is_string($b) && str_contains($a, $b); break;
                }
                $outputs[$nodeId] = ['result' => $result];
                WorkflowLog::create([
                    'execution_id' => $execution->id,
                    'node_id' => $nodeId,
                    'type' => 'info',
                    'message' => 'Condition evaluated',
                    'data' => ['result' => $result],
                ]);

                $next = null;
                foreach ($outgoing as $e) {
                    if (($e->label ?? '') === ($result ? 'TRUE' : 'FALSE')) {
                        $next = $e->target_node_id;
                        break;
                    }
                }
                if ($next) {
                    $processNode($next);
                }
                return;
            } elseif ($node->type === 'email') {
                $outputs[$nodeId] = ['status' => 'queued'];
                WorkflowLog::create([
                    'execution_id' => $execution->id,
                    'node_id' => $nodeId,
                    'type' => 'info',
                    'message' => 'Email queued',
                    'data' => ['recipient' => $node->settings['recipient'] ?? null],
                ]);
            } elseif ($node->type === 'ai') {
                $outputs[$nodeId] = ['output' => 'ok', 'confidence' => 0.9];
                WorkflowLog::create([
                    'execution_id' => $execution->id,
                    'node_id' => $nodeId,
                    'type' => 'info',
                    'message' => 'AI processed',
                    'data' => [],
                ]);
            } elseif ($node->type === 'delay') {
                $outputs[$nodeId] = ['completed' => true];
                WorkflowLog::create([
                    'execution_id' => $execution->id,
                    'node_id' => $nodeId,
                    'type' => 'info',
                    'message' => 'Delay completed',
                    'data' => ['delay' => $node->settings['delay'] ?? 0],
                ]);
            } elseif ($node->type === 'erp' || $node->type === 'trigger') {
                $outputs[$nodeId] = ['result' => 'ok'];
                WorkflowLog::create([
                    'execution_id' => $execution->id,
                    'node_id' => $nodeId,
                    'type' => 'info',
                    'message' => 'Node processed',
                    'data' => [],
                ]);
            }

            foreach ($outgoing as $e) {
                $processNode($e->target_node_id);
            }
        };

        $processNode($trigger->id);

        $execution->update(['status' => 'completed', 'ended_at' => now()]);
    }
}
