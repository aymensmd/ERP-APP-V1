<?php

namespace App\Services;

use App\Models\User;
use App\Models\Department;

class ApprovalChainService
{
    /**
     * Get the next approver for a specific action.
     * 
     * @param User $requester The user making the request
     * @param string $type The type of request (vacation, budget, etc.)
     * @return User|null The resolved approver or null if none found
     */
    public function getNextApprover(User $requester, string $type)
    {
        return match($type) {
            'vacation' => $this->getManagerApprover($requester),
            'budget', 'expense' => $this->getDepartmentHeadApprover($requester),
            default => $this->getManagerApprover($requester),
        };
    }

    /**
     * Get the direct manager. If requester has no manager, return null (or maybe admin).
     */
    private function getManagerApprover(User $requester)
    {
        // If requester is the CEO/Top Manager (no manager), maybe auto-approve or go to Board?
        // For now, return null imply no approval needed or manual admin intervention.
        if (!$requester->manager_id) {
            return null; 
        }

        return User::find($requester->manager_id);
    }

    /**
     * Get the Department Head.
     */
    private function getDepartmentHeadApprover(User $requester)
    {
        if (!$requester->department_id) {
            return $this->getManagerApprover($requester); // Fallback
        }

        $department = Department::find($requester->department_id);
        
        // If requester IS the department head, go to parent department head OR their manager
        if ($department && $department->manager_id === $requester->id) {
            // Check parent department
            if ($department->parent_id) {
                $parentDept = Department::find($department->parent_id);
                if ($parentDept && $parentDept->manager_id) {
                    return User::find($parentDept->manager_id);
                }
            }
            // Fallback to direct manager (who might be VP or CEO)
            return $this->getManagerApprover($requester);
        }

        if ($department && $department->manager_id) {
            return User::find($department->manager_id);
        }

        return $this->getManagerApprover($requester); // Fallback
    }
}
