<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the employees.
     */
    public function index(Request $request)
    {
        $query = User::with(['department', 'role', 'vacations']);

        // Filter by department if provided
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by role if provided
        if ($request->has('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $employees = $query->paginate($perPage);
        return EmployeeResource::collection($employees);
    }

    /**
     * Store a newly created employee in storage.
     */
    public function store(StoreEmployeeRequest $request)
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);

        $employee = User::create($validated);
        $employee->load(['department', 'role']);

        return new EmployeeResource($employee);
    }

    /**
     * Display the specified employee.
     */
    public function show(User $employee)
    {
        $employee->load(['department', 'role', 'vacations', 'events']);
        return new EmployeeResource($employee);
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(UpdateEmployeeRequest $request, User $employee)
    {
        // Only allow admin or the user themselves to update
        if ($employee->id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only admin can update other employees.'], 403);
        }

        $validated = $request->validated();

        // Map role name to role_id if needed
        if (isset($validated['role']) && !isset($validated['role_id'])) {
            $role = \App\Models\Role::where('name', $validated['role'])->first();
            if ($role) {
                $validated['role_id'] = $role->id;
            }
            unset($validated['role']);
        }

        // Map department name to department_id if needed
        if (isset($validated['department']) && !isset($validated['department_id'])) {
            $department = \App\Models\Department::where('name', $validated['department'])->first();
            if ($department) {
                $validated['department_id'] = $department->id;
            }
            unset($validated['department']);
        }

        // Hash password if provided (requires old password verification)
        if (isset($validated['password'])) {
            // Require old password for password updates
            if (!isset($validated['old_password'])) {
                return response()->json(['message' => 'Old password is required to update password'], 422);
            }
            
            // Verify old password
            if (!Hash::check($validated['old_password'], $employee->password)) {
                return response()->json(['message' => 'Old password is incorrect'], 422);
            }
            
            $validated['password'] = Hash::make($validated['password']);
            unset($validated['old_password']);
        }

        $employee->update($validated);
        $employee->load(['department', 'role']);

        return new EmployeeResource($employee);
    }

    /**
     * Remove the specified employee from storage.
     */
    public function destroy(Request $request, User $employee)
    {
        // Only admin can delete employees
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Only admin can delete employees.'], 403);
        }

        $employee->delete();
        return response()->json(['message' => 'Employee deleted successfully']);
    }
}

