<?php

namespace App\Http\Controllers;

use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the departments.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $departments = Department::paginate($perPage);
        return DepartmentResource::collection($departments);
    }

    /**
     * Store a newly created department in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:departments',
            'description' => 'nullable|string',
        ]);

        // Automatically set company_id from tenant context
        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
        if ($companyId) {
            $validated['company_id'] = $companyId;
        }

        $department = Department::create($validated);
        return new DepartmentResource($department);
    }

    /**
     * Display the specified department.
     */
    public function show(Department $department)
    {
        return new DepartmentResource($department);
    }

    /**
     * Update the specified department in storage.
     */
    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:departments,slug,' . $department->id,
            'description' => 'nullable|string',
        ]);

        $department->update($validated);
        return new DepartmentResource($department);
    }

    /**
     * Remove the specified department from storage.
     */
    public function destroy(Department $department)
    {
        // Check if department has users assigned
        if ($department->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete department with assigned users. Please reassign users first.',
                'users_count' => $department->users()->count()
            ], 422);
        }
        
        $department->delete();
        return response()->json(['message' => 'Department deleted successfully']);
    }
}

