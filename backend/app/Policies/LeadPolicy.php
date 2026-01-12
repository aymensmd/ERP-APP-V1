<?php

namespace App\Policies;

use Illuminate\Auth\Access\HandlesAuthorization;
use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any leads.
     */
    public function viewAny(User $user)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        return $user->hasPermissionInCompany('leads.view', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can view the lead.
     */
    public function view(User $user, Lead $lead)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($lead->company_id !== $companyId) {
            return false;
        }

        if ($user->isAdminInCompany($companyId)) {
            return true;
        }

        // Assigned user can always view
        if ($lead->assigned_to === $user->id) {
            return true;
        }

        // Creator can always view
        if ($lead->created_by === $user->id) {
            return true;
        }

        $scope = $user->getPermissionScope('leads.view', $companyId);

        return match($scope) {
            'company' => true,
            'department' => $this->isInSameDepartment($user, $lead),
            'self' => $lead->assigned_to === $user->id || $lead->created_by === $user->id,
            default => false,
        };
    }

    /**
     * Determine whether the user can create leads.
     */
    public function create(User $user)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        return $user->hasPermissionInCompany('leads.create', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Determine whether the user can update the lead.
     */
    public function update(User $user, Lead $lead)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($lead->company_id !== $companyId) {
            return false;
        }

        if ($user->isAdminInCompany($companyId)) {
            return true;
        }

        // Assigned user can update
        if ($lead->assigned_to === $user->id) {
            return true;
        }

        $scope = $user->getPermissionScope('leads.update', $companyId);

        return match($scope) {
            'company' => true,
            'department' => $this->isInSameDepartment($user, $lead),
            'self' => $lead->assigned_to === $user->id || $lead->created_by === $user->id,
            default => false,
        };
    }

    /**
     * Determine whether the user can delete the lead.
     */
    public function delete(User $user, Lead $lead)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($lead->company_id !== $companyId) {
            return false;
        }

        return $user->hasPermissionInCompany('leads.delete', $companyId) || 
               $user->isAdminInCompany($companyId);
    }

    /**
     * Check if lead's assigned user is in same department.
     */
    private function isInSameDepartment(User $user, Lead $lead): bool
    {
        if ($lead->assigned_to) {
            $assignedUser = User::find($lead->assigned_to);
            if ($assignedUser && $assignedUser->department_id === $user->department_id) {
                return true;
            }
        }

        if ($lead->created_by) {
            $creator = User::find($lead->created_by);
            if ($creator && $creator->department_id === $user->department_id) {
                return true;
            }
        }

        return false;
    }
}
