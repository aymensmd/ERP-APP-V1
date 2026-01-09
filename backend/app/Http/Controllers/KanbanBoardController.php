<?php

namespace App\Http\Controllers;

use App\Models\KanbanBoard;
use App\Models\KanbanTask;
use Illuminate\Http\Request;

class KanbanBoardController extends Controller
{
    /**
     * Display a listing of boards.
     */
    public function index(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = KanbanBoard::where('company_id', $companyId)
                ->with(['creator', 'project'])
                ->where('is_archived', false);

            if ($request->has('project_id')) {
                $query->where('project_id', $request->input('project_id'));
            }

            $boards = $query->orderBy('created_at', 'desc')->get();

            return response()->json($boards);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch boards: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created board.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'project_id' => 'nullable|exists:events,id',
                'settings' => 'nullable|array',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $board = KanbanBoard::create([
                'company_id' => $companyId,
                'created_by' => auth()->id(),
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'project_id' => $validated['project_id'] ?? null,
                'settings' => $validated['settings'] ?? ['columns' => ['todo', 'in_progress', 'done']],
            ]);

            return response()->json([
                'message' => 'Board created successfully',
                'board' => $board->load(['creator', 'project'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create board: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified board with tasks.
     */
    public function show($id)
    {
        try {
            $board = KanbanBoard::with([
                'tasks.assignedTo',
                'tasks.createdBy',
                'tasks.dependencies',
                'creator',
                'project'
            ])->findOrFail($id);

            // Group tasks by status
            $tasksByStatus = $board->tasks->groupBy('status');

            return response()->json([
                'board' => $board,
                'tasks' => $tasksByStatus
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Board not found'], 404);
        }
    }

    /**
     * Update the specified board.
     */
    public function update(Request $request, $id)
    {
        try {
            $board = KanbanBoard::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'settings' => 'nullable|array',
                'is_archived' => 'boolean',
            ]);

            $board->update($validated);

            return response()->json([
                'message' => 'Board updated successfully',
                'board' => $board
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update board'], 500);
        }
    }

    /**
     * Remove the specified board.
     */
    public function destroy($id)
    {
        try {
            $board = KanbanBoard::findOrFail($id);
            $board->delete(); // Will cascade delete tasks

            return response()->json(['message' => 'Board deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete board'], 500);
        }
    }
}




