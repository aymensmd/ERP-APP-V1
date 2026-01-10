<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the employees.
     */
    public function index(Request $request)
    {
        $companyId = $request->attributes->get('current_company_id') ?? 
                     session('current_company_id') ?? 
                     ($request->header('X-Company-ID') ? (int)$request->header('X-Company-ID') : null);
        
        if (!$companyId) {
            return response()->json(['error' => 'Company context is required'], 400);
        }

        // Check permission
        if (!$request->user()->hasPermissionInCompany('employees.view', $companyId)) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to view employees.'], 403);
        }

        // Get users that belong to this company
        $companyUserIds = DB::table('company_user')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->pluck('user_id')
            ->toArray();

        $query = User::with(['department', 'role', 'manager', 'vacations'])
            ->whereIn('id', $companyUserIds);

        // Filter by department if provided
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by role if provided
        if ($request->has('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by employment_type if provided
        if ($request->has('employment_type')) {
            $query->where('employment_type', $request->employment_type);
        }

        // Search by name, email, or employee_id
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

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
        $companyId = $request->attributes->get('current_company_id') ?? 
                     session('current_company_id') ?? 
                     ($request->header('X-Company-ID') ? (int)$request->header('X-Company-ID') : null);
        
        if (!$companyId) {
            return response()->json(['error' => 'Company context is required'], 400);
        }

        // Check permission
        if (!$request->user()->hasPermissionInCompany('employees.create', $companyId)) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to create employees.'], 403);
        }

        // Extract custom permissions if provided
        $customPermissions = $validated['permissions'] ?? null;
        unset($validated['permissions']);

        // Hash password
        $validated['password'] = Hash::make($validated['password']);

        // Generate employee_id if not provided
        if (empty($validated['employee_id'])) {
            $lastEmployee = User::whereNotNull('employee_id')
                ->where('employee_id', 'like', 'EMP-%')
                ->orderBy('id', 'desc')
                ->first();
            
            if ($lastEmployee && $lastEmployee->employee_id) {
                // Extract number from last employee_id
                $lastNumber = (int)substr($lastEmployee->employee_id, 4);
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }
            $validated['employee_id'] = 'EMP-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
        }

        // Set default status if not provided
        if (empty($validated['status'])) {
            $validated['status'] = 'active';
        }

        // Set default employment_type if not provided
        if (empty($validated['employment_type'])) {
            $validated['employment_type'] = 'full-time';
        }

        $employee = User::create($validated);
        
        // Add employee to company with role and permissions
        $roleId = $validated['role_id'] ?? null;
        $departmentId = $validated['department_id'] ?? null;
        
        // Ensure the employee has role_id and department_id on the User model itself
        // (these are also stored in company_user pivot, but User model should have them too)
        if ($roleId && !$employee->role_id) {
            $employee->update(['role_id' => $roleId]);
        }
        if ($departmentId && !$employee->department_id) {
            $employee->update(['department_id' => $departmentId]);
        }
        
        // Attach to company with pivot data
        $employee->companies()->attach($companyId, [
            'role_id' => $roleId,
            'department_id' => $departmentId,
            'status' => 'active',
            'joined_at' => now(),
            'permissions' => $customPermissions ? json_encode($customPermissions) : null,
        ]);

        $employee->refresh();
        $employee->load(['department', 'role', 'manager']);
        
        return response()->json([
            'message' => 'Employee created successfully',
            'employee' => new EmployeeResource($employee)
        ], 201);
    }

    /**
     * Display the specified employee.
     */
    public function show(Request $request, User $employee)
    {
        $companyId = $request->attributes->get('current_company_id') ?? 
                     session('current_company_id') ?? 
                     ($request->header('X-Company-ID') ? (int)$request->header('X-Company-ID') : null);
        
        if (!$companyId) {
            return response()->json(['error' => 'Company context is required'], 400);
        }

        // Check permission
        if (!$request->user()->hasPermissionInCompany('employees.view', $companyId)) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to view employees.'], 403);
        }

        $employee->load(['department', 'role', 'manager', 'vacations', 'events']);
        return new EmployeeResource($employee);
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(UpdateEmployeeRequest $request, User $employee)
    {
        $companyId = $request->attributes->get('current_company_id') ?? 
                     session('current_company_id') ?? 
                     ($request->header('X-Company-ID') ? (int)$request->header('X-Company-ID') : null);
        
        if (!$companyId) {
            return response()->json(['error' => 'Company context is required'], 400);
        }

        // Check if user can update (self-update or has permission)
        $canUpdate = ($employee->id === $request->user()->id) || 
                     $request->user()->hasPermissionInCompany('employees.update', $companyId);
        
        if (!$canUpdate) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to update this employee.'], 403);
        }

        $validated = $request->validated();
        $isAdminOrManager = $request->user()->hasPermissionInCompany('employees.update', $companyId);
        $isSelfUpdate = $employee->id === $request->user()->id;
        
        // Extract custom permissions if provided (only for admins/managers)
        $customPermissions = null;
        if (isset($validated['permissions']) && $isAdminOrManager) {
            $customPermissions = $validated['permissions'];
            unset($validated['permissions']);
        }

        // If self-update, restrict what can be changed
        if ($isSelfUpdate && !$isAdminOrManager) {
            // Employees can only update: name, email, password, phone_number, address, date_of_birth
            $allowedFields = ['name', 'email', 'password', 'old_password', 'phone_number', 'address', 'date_of_birth'];
            $validated = array_intersect_key($validated, array_flip($allowedFields));
            
            // Remove role/department/permissions from self-updates
            unset($validated['role_id'], $validated['department_id'], $validated['manager_id'], 
                  $validated['position'], $validated['salary'], $validated['status'], 
                  $validated['employment_type'], $validated['hire_date']);
        }

        // Map role name to role_id if needed (only for admins/managers)
        if (isset($validated['role']) && !isset($validated['role_id']) && $isAdminOrManager) {
            $role = \App\Models\Role::where('name', $validated['role'])->first();
            if ($role) {
                $validated['role_id'] = $role->id;
            }
            unset($validated['role']);
        }

        // Map department name to department_id if needed (only for admins/managers)
        if (isset($validated['department']) && !isset($validated['department_id']) && $isAdminOrManager) {
            $department = \App\Models\Department::where('name', $validated['department'])->first();
            if ($department) {
                $validated['department_id'] = $department->id;
            }
            unset($validated['department']);
        }

        // Hash password if provided (requires old password verification)
        if (isset($validated['password'])) {
            // Require old password for password updates (unless admin creating for someone else)
            if (!isset($validated['old_password']) && ($isSelfUpdate || !$isAdminOrManager)) {
                return response()->json(['message' => 'Old password is required to update password'], 422);
            }
            
            // Verify old password if provided (self-update or non-admin)
            if (isset($validated['old_password']) && !Hash::check($validated['old_password'], $employee->password)) {
                return response()->json(['message' => 'Old password is incorrect'], 422);
            }
            
            $validated['password'] = Hash::make($validated['password']);
            unset($validated['old_password']);
        }

        $employee->update($validated);
        
        // Update company_user pivot if role/department/permissions changed (only for admins/managers)
        if ($request->user()->hasPermissionInCompany('employees.update', $companyId)) {
            $pivotData = [];
            if (isset($validated['role_id'])) {
                $pivotData['role_id'] = $validated['role_id'];
            }
            if (isset($validated['department_id'])) {
                $pivotData['department_id'] = $validated['department_id'];
            }
            if ($customPermissions !== null) {
                $pivotData['permissions'] = json_encode($customPermissions);
            }
            
            if (!empty($pivotData)) {
                $employee->companies()->updateExistingPivot($companyId, $pivotData);
            }
        }
        
        $employee->load(['department', 'role', 'manager']);

        return new EmployeeResource($employee);
    }

    /**
     * Remove the specified employee from storage.
     */
    public function destroy(Request $request, User $employee)
    {
        $companyId = $request->attributes->get('current_company_id') ?? 
                     session('current_company_id') ?? 
                     ($request->header('X-Company-ID') ? (int)$request->header('X-Company-ID') : null);
        
        if (!$companyId) {
            return response()->json(['error' => 'Company context is required'], 400);
        }

        // Check permission
        if (!$request->user()->hasPermissionInCompany('employees.delete', $companyId)) {
            return response()->json(['message' => 'Unauthorized. You do not have permission to delete employees.'], 403);
        }

        // Soft delete: Remove from company instead of deleting user
        $employee->companies()->detach($companyId);
        
        // Or hard delete if this is the only company
        $remainingCompanies = $employee->companies()->count();
        if ($remainingCompanies === 0) {
            $employee->delete();
        }

        return response()->json(['message' => 'Employee removed successfully']);
    }
}

