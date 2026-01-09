<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVacationRequest;
use App\Http\Requests\UpdateVacationRequest;
use App\Http\Resources\VacationResource;
use App\Models\Vacation;
use Illuminate\Http\Request;

class VacationController extends Controller
{
    /**
     * Display a listing of the vacations.
     * Supports query parameter: ?user_id=123
     */
    public function index(Request $request)
    {
        $query = Vacation::with(['user', 'approver']);

        // Check query parameter first
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        // If no userId is provided, default to authenticated user's vacations
        else {
            $query->where('user_id', $request->user()->id);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Order by created_at desc
        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 15);
        $vacations = $query->paginate($perPage);
        return VacationResource::collection($vacations);
    }

    /**
     * Store a newly created vacation in storage.
     */
    public function store(StoreVacationRequest $request)
    {
        $validated = $request->validated();
        
        // If user_id is not provided, use authenticated user
        if (!isset($validated['user_id'])) {
            $validated['user_id'] = $request->user()->id;
        }

        // Automatically set company_id from tenant context
        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
        if ($companyId) {
            $validated['company_id'] = $companyId;
        }

        $vacation = Vacation::create($validated);
        $vacation->load(['user', 'approver']);

        return response()->json([
            'message' => 'Vacation request created successfully',
            'data' => new VacationResource($vacation)
        ], 201);
    }

    /**
     * Display the specified vacation.
     */
    public function show(Vacation $vacation)
    {
        $vacation->load(['user', 'approver']);
        return new VacationResource($vacation);
    }

    /**
     * Update the specified vacation in storage.
     */
    public function update(UpdateVacationRequest $request, Vacation $vacation)
    {
        // Only allow user to update if status is Pending, or if user owns it, or if admin
        if ($vacation->status !== 'Pending' && $vacation->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Cannot update vacation that is not pending'], 403);
        }

        $validated = $request->validated();
        $vacation->update($validated);
        $vacation->load(['user', 'approver']);

        return new VacationResource($vacation);
    }

    /**
     * Approve the specified vacation.
     */
    public function approve(Request $request, Vacation $vacation)
    {
        // Only admins can approve (handled by middleware, but keeping check for safety)
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vacation->update([
            'status' => 'Approuvé',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $vacation->load(['user', 'approver']);
        return new VacationResource($vacation);
    }

    /**
     * Reject the specified vacation.
     */
    public function reject(Request $request, Vacation $vacation)
    {
        // Only admins can reject (handled by middleware, but keeping check for safety)
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $vacation->update([
            'status' => 'Refusé',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        $vacation->load(['user', 'approver']);
        return new VacationResource($vacation);
    }

    /**
     * Remove the specified vacation from storage.
     */
    public function destroy(Request $request, Vacation $vacation)
    {
        // Only allow user to delete if status is Pending, or admin can delete any
        if ($vacation->status !== 'Pending' && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Cannot delete vacation that is not pending'], 403);
        }

        if ($vacation->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vacation->delete();
        return response()->json(['message' => 'Vacation deleted successfully']);
    }
}

