<?php

namespace App\Policies;

use Illuminate\Auth\Access\HandlesAuthorization;
use App\Models\User;

class EmployeePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any employees.
     */
    public function viewAny(User $user)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if (!$companyId) {
            return false;
        }
        
        return $user->hasPermissionInCompany('employees.view', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can view the employee.
     */
    public function view(User $user, User $employee)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        // Must belong to same company via company_user
        if (!$this->belongsToSameCompany($user, $employee, $companyId)) {
            return false;
        }

        // Admin can view anyone
        if ($user->isAdminInCompany($companyId)) {
            return true;
        }

        // Self can always view own profile
        if ($user->id === $employee->id) {
            return true;
        }

        // Check permission scope
        $scope = $user->getPermissionScope('employees.view', $companyId);

        return match($scope) {
            'company' => true,
            'department' => $employee->department_id === $user->department_id,
            'self' => $employee->id === $user->id,
            default => false,
        };
    }

    /**
     * Determine whether the user can create employees.
     */
    public function create(User $user)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        return $user->hasPermissionInCompany('employees.create', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can update the employee.
     */
    public function update(User $user, User $employee)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if (!$this->belongsToSameCompany($user, $employee, $companyId)) {
            return false;
        }

        if ($user->isAdminInCompany($companyId)) {
            return true;
        }

        // Manager can update direct reports
        if ($employee->manager_id === $user->id) {
            return $user->hasPermissionInCompany('employees.update', $companyId);
        }

        // Self can update basic info (controller should limit fields)
        if ($user->id === $employee->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the employee.
     */
    public function delete(User $user, User $employee)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if (!$this->belongsToSameCompany($user, $employee, $companyId)) {
            return false;
        }

        // Only admins can delete employees
        return $user->isAdminInCompany($companyId);
    }

    /**
     * Check if users belong to same company.
     */
    private function belongsToSameCompany(User $user, User $employee, $companyId): bool
    {
        $employeeInCompany = \DB::table('company_user')
            ->where('user_id', $employee->id)
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->exists();

        return $employeeInCompany;
    }
}
