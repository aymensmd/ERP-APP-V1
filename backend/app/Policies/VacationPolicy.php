<?php

namespace App\Policies;

use Illuminate\Auth\Access\HandlesAuthorization;
use App\Models\Vacation;
use App\Models\User;

class VacationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any vacations.
     */
    public function viewAny(User $user)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        return $user->hasPermissionInCompany('vacations.view', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can view the vacation.
     */
    public function view(User $user, Vacation $vacation)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($vacation->company_id !== $companyId) {
            return false;
        }

        // User can view own vacations
        if ($vacation->user_id === $user->id) {
            return true;
        }

        // Manager can view subordinates' vacations
        $employee = User::find($vacation->user_id);
        if ($employee && $employee->manager_id === $user->id) {
            return true;
        }

        $scope = $user->getPermissionScope('vacations.view', $companyId);

        return match($scope) {
            'company' => true,
            'department' => $employee && $employee->department_id === $user->department_id,
            'self' => $vacation->user_id === $user->id,
            default => false,
        };
    }

    /**
     * Determine whether the user can create vacations.
     */
    public function create(User $user)
    {
        // Anyone can request vacation for themselves
        return true;
    }

    /**
     * Determine whether the user can update the vacation.
     */
    public function update(User $user, Vacation $vacation)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($vacation->company_id !== $companyId) {
            return false;
        }

        // User can update own pending vacations
        if ($vacation->user_id === $user->id && $vacation->status === 'pending') {
            return true;
        }

        // Admin/HR can update any vacation
        return $user->isAdminInCompany($companyId) ||
               $user->hasPermissionInCompany('vacations.manage', $companyId);
    }

    /**
     * Determine whether the user can delete the vacation.
     */
    public function delete(User $user, Vacation $vacation)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($vacation->company_id !== $companyId) {
            return false;
        }

        // User can delete own pending vacations
        if ($vacation->user_id === $user->id && $vacation->status === 'pending') {
            return true;
        }

        // Admin can delete any vacation
        return $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can approve the vacation.
     */
    public function approve(User $user, Vacation $vacation)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($vacation->company_id !== $companyId) {
            return false;
        }

        // Cannot approve own vacation
        if ($vacation->user_id === $user->id) {
            return false;
        }

        $employee = User::find($vacation->user_id);

        // Manager can approve direct reports' vacations
        if ($employee && $employee->manager_id === $user->id) {
            return $user->hasPermissionInCompany('vacations.approve', $companyId);
        }

        // HR/Admin with company scope can approve anyone's vacation
        if ($user->getPermissionScope('vacations.approve', $companyId) === 'company') {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can reject the vacation.
     */
    public function reject(User $user, Vacation $vacation)
    {
        return $this->approve($user, $vacation);
    }
}
