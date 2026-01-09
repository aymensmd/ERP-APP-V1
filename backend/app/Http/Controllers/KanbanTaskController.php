<?php

namespace App\Http\Controllers;

use App\Models\KanbanTask;
use App\Models\KanbanBoard;
use App\Models\TaskDependency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KanbanTaskController extends Controller
{
    /**
     * Store a newly created task.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'board_id' => 'required|exists:kanban_boards,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'required|string|max:255',
                'priority' => 'nullable|in:low,medium,high,urgent',
                'due_date' => 'nullable|date',
                'assigned_to' => 'nullable|exists:users,id',
                'tags' => 'nullable|array',
                'estimated_hours' => 'nullable|integer|min:0',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                // Try to get from board (bypass company scope)
                $board = KanbanBoard::withoutGlobalScopes()->find($validated['board_id']);
                if ($board) {
                    $companyId = $board->company_id;
                }
            }
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required. Please ensure you are logged in and have selected a company.'], 400);
            }
            
            // Ensure user is authenticated
            if (!auth()->check()) {
                return response()->json(['error' => 'Authentication required'], 401);
            }

            // Get max position in the status column (temporarily disable company scope)
            $maxPosition = KanbanTask::withoutGlobalScopes()
                ->where('board_id', $validated['board_id'])
                ->where('status', $validated['status'])
                ->where('company_id', $companyId)
                ->max('position') ?? 0;

            $taskData = [
                'company_id' => $companyId,
                'created_by' => auth()->id(),
                'board_id' => $validated['board_id'],
                'title' => $validated['title'],
                'status' => $validated['status'],
                'position' => $maxPosition + 1,
                'priority' => $validated['priority'] ?? 'medium',
            ];
            
            // Add optional fields only if they exist
            if (isset($validated['description']) && $validated['description']) {
                $taskData['description'] = $validated['description'];
            }
            if (isset($validated['due_date']) && $validated['due_date']) {
                $taskData['due_date'] = $validated['due_date'];
            }
            if (isset($validated['assigned_to']) && $validated['assigned_to']) {
                $taskData['assigned_to'] = $validated['assigned_to'];
            }
            if (isset($validated['tags']) && $validated['tags']) {
                $taskData['tags'] = $validated['tags'];
            }
            if (isset($validated['estimated_hours']) && $validated['estimated_hours']) {
                $taskData['estimated_hours'] = $validated['estimated_hours'];
            }
            
            $task = KanbanTask::create($taskData);

            return response()->json([
                'message' => 'Task created successfully',
                'task' => $task->load(['assignedTo', 'createdBy', 'board'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Kanban task creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'error' => 'Failed to create task: ' . $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, $id)
    {
        try {
            $task = KanbanTask::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'sometimes|required|string|max:255',
                'position' => 'nullable|integer|min:0',
                'priority' => 'nullable|in:low,medium,high,urgent',
                'due_date' => 'nullable|date',
                'assigned_to' => 'nullable|exists:users,id',
                'tags' => 'nullable|array',
                'estimated_hours' => 'nullable|integer|min:0',
                'actual_hours' => 'nullable|integer|min:0',
            ]);

            // If status changed, update position to end of new column
            if (isset($validated['status']) && $validated['status'] !== $task->status) {
                $maxPosition = KanbanTask::where('board_id', $task->board_id)
                    ->where('status', $validated['status'])
                    ->where('id', '!=', $task->id)
                    ->max('position') ?? 0;
                $validated['position'] = $maxPosition + 1;
            }

            $task->update($validated);

            return response()->json([
                'message' => 'Task updated successfully',
                'task' => $task->load(['assignedTo', 'createdBy', 'board'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update task: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update task positions (for drag and drop).
     */
    public function updatePositions(Request $request)
    {
        try {
            $validated = $request->validate([
                'tasks' => 'required|array',
                'tasks.*.id' => 'required|exists:kanban_tasks,id',
                'tasks.*.status' => 'required|string',
                'tasks.*.position' => 'required|integer|min:0',
            ]);

            DB::transaction(function() use ($validated) {
                foreach ($validated['tasks'] as $taskData) {
                    KanbanTask::where('id', $taskData['id'])->update([
                        'status' => $taskData['status'],
                        'position' => $taskData['position'],
                    ]);
                }
            });

            return response()->json(['message' => 'Task positions updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update positions: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified task.
     */
    public function destroy($id)
    {
        try {
            $task = KanbanTask::findOrFail($id);
            $task->delete();

            return response()->json(['message' => 'Task deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete task'], 500);
        }
    }

    /**
     * Add a dependency.
     */
    public function addDependency(Request $request, $taskId)
    {
        try {
            $validated = $request->validate([
                'depends_on_task_id' => 'required|exists:kanban_tasks,id',
                'type' => 'nullable|in:blocks,blocked_by,related',
            ]);

            $dependency = TaskDependency::create([
                'task_id' => $taskId,
                'depends_on_task_id' => $validated['depends_on_task_id'],
                'type' => $validated['type'] ?? 'blocks',
            ]);

            return response()->json([
                'message' => 'Dependency added successfully',
                'dependency' => $dependency->load(['dependsOn'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to add dependency: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove a dependency.
     */
    public function removeDependency($dependencyId)
    {
        try {
            $dependency = TaskDependency::findOrFail($dependencyId);
            $dependency->delete();

            return response()->json(['message' => 'Dependency removed successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to remove dependency'], 500);
        }
    }
}


