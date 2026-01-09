<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\ShiftAssignment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ShiftController extends Controller
{
    /**
     * Display a listing of shifts.
     */
    public function index(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = Shift::where('company_id', $companyId);

            if ($request->has('is_active')) {
                $query->where('is_active', $request->input('is_active'));
            } else {
                $query->where('is_active', true);
            }

            $shifts = $query->orderBy('name')->get();

            return response()->json($shifts);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch shifts: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created shift.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'description' => 'nullable|string',
                'days_of_week' => 'nullable|array',
                'days_of_week.*' => 'integer|min:0|max:6', // 0=Sunday, 6=Saturday
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            $start = Carbon::parse($validated['start_time']);
            $end = Carbon::parse($validated['end_time']);
            
            // Handle overnight shifts
            if ($end <= $start) {
                $end->addDay();
            }
            
            $durationHours = $start->diffInHours($end);

            $shift = Shift::create([
                'company_id' => $companyId,
                'name' => $validated['name'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'duration_hours' => $durationHours,
                'description' => $validated['description'] ?? null,
                'days_of_week' => $validated['days_of_week'] ?? null,
                'is_active' => true,
            ]);

            return response()->json([
                'message' => 'Shift created successfully',
                'shift' => $shift
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create shift: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified shift.
     */
    public function show($id)
    {
        try {
            $shift = Shift::with('assignments.user')->findOrFail($id);
            return response()->json($shift);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Shift not found'], 404);
        }
    }

    /**
     * Update the specified shift.
     */
    public function update(Request $request, $id)
    {
        try {
            $shift = Shift::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'start_time' => 'sometimes|required|date_format:H:i',
                'end_time' => 'sometimes|required|date_format:H:i',
                'description' => 'nullable|string',
                'days_of_week' => 'nullable|array',
                'is_active' => 'boolean',
            ]);

            if (isset($validated['start_time']) || isset($validated['end_time'])) {
                $start = Carbon::parse($validated['start_time'] ?? $shift->start_time);
                $end = Carbon::parse($validated['end_time'] ?? $shift->end_time);
                
                if ($end <= $start) {
                    $end->addDay();
                }
                
                $validated['duration_hours'] = $start->diffInHours($end);
            }

            $shift->update($validated);

            return response()->json([
                'message' => 'Shift updated successfully',
                'shift' => $shift
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update shift'], 500);
        }
    }

    /**
     * Remove the specified shift.
     */
    public function destroy($id)
    {
        try {
            $shift = Shift::findOrFail($id);
            $shift->delete();

            return response()->json(['message' => 'Shift deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete shift'], 500);
        }
    }

    /**
     * Get shift assignments.
     */
    public function assignments(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = ShiftAssignment::where('company_id', $companyId)
                ->with(['user', 'shift', 'assignedBy']);

            // Filter by user
            if ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->where('assignment_date', '>=', $request->input('start_date'));
            }
            if ($request->has('end_date')) {
                $query->where('assignment_date', '<=', $request->input('end_date'));
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            $query->orderBy('assignment_date')->orderBy('start_time');

            $assignments = $query->get();

            return response()->json($assignments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch assignments: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Assign shift to user.
     */
    public function assignShift(Request $request)
    {
        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'shift_id' => 'required|exists:shifts,id',
                'assignment_date' => 'required|date',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i',
                'notes' => 'nullable|string',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            $shift = Shift::findOrFail($validated['shift_id']);

            $assignment = ShiftAssignment::create([
                'company_id' => $companyId,
                'user_id' => $validated['user_id'],
                'shift_id' => $validated['shift_id'],
                'assignment_date' => $validated['assignment_date'],
                'start_time' => $validated['start_time'] ?? $shift->start_time,
                'end_time' => $validated['end_time'] ?? $shift->end_time,
                'status' => 'scheduled',
                'notes' => $validated['notes'] ?? null,
                'assigned_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Shift assigned successfully',
                'assignment' => $assignment->load(['user', 'shift', 'assignedBy'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to assign shift: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update shift assignment.
     */
    public function updateAssignment(Request $request, $assignmentId)
    {
        try {
            $assignment = ShiftAssignment::findOrFail($assignmentId);

            $validated = $request->validate([
                'status' => 'sometimes|in:scheduled,confirmed,completed,cancelled,no_show',
                'start_time' => 'nullable|date_format:H:i',
                'end_time' => 'nullable|date_format:H:i',
                'notes' => 'nullable|string',
            ]);

            $assignment->update($validated);

            return response()->json([
                'message' => 'Assignment updated successfully',
                'assignment' => $assignment->load(['user', 'shift'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update assignment'], 500);
        }
    }

    /**
     * Delete shift assignment.
     */
    public function deleteAssignment($assignmentId)
    {
        try {
            $assignment = ShiftAssignment::findOrFail($assignmentId);
            $assignment->delete();

            return response()->json(['message' => 'Assignment deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete assignment'], 500);
        }
    }
}



