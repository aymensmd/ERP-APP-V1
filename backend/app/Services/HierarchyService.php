<?php

namespace App\Services;

use App\Models\Department;
use App\Models\User;

class HierarchyService
{
    /**
     * Build the full organization tree for a company.
     * Includes departments and employees.
     */
    public function getOrganizationTree($companyId)
    {
        $departments = Department::where('company_id', $companyId)
            ->root()
            ->with(['children', 'head', 'users' => function($q) {
                // Load user basic info
                $q->select('id', 'name', 'email', 'position', 'role_id', 'department_id');
            }])
            ->orderBy('order')
            ->get();

        return $departments->map(function ($dept) {
            return $this->formatDepartmentNode($dept);
        });
    }

    /**
     * Recursive formatting of department nodes.
     */
    private function formatDepartmentNode($department)
    {
        $node = [
            'id' => 'dept-' . $department->id,
            'key' => 'dept-' . $department->id,
            'type' => 'department',
            'name' => $department->name,
            'head' => $department->head ? $department->head->name : 'Unassigned',
            'children' => [],
        ];

        // Add sub-departments
        foreach ($department->children as $child) {
            $node['children'][] = $this->formatDepartmentNode($child);
        }

        // Add employees (leaves of this department node)
        foreach ($department->users as $user) {
            $node['children'][] = [
                'id' => 'user-' . $user->id,
                'key' => 'user-' . $user->id,
                'type' => 'user',
                'name' => $user->name,
                'position' => $user->position ?? 'Employee',
                'role_id' => $user->role_id,
                'email' => $user->email,
                // 'avatar' => $user->profile_photo_path, 
                // Don't recurse into user's subordinates here to avoid confusion in Dept View
                // User hierarchy is better for "Reporting View"
            ];
        }

        return $node;
    }

    /**
     * Get reporting line tree (Manager -> Subordinates).
     */
    public function getReportingTree($managerId = null, $companyId)
    {
        if (!$managerId) {
            // Get top managers (those with no manager in this company)
            // Or validation rule: admin or CEO
            // For now, get admins or users with no manager
            $query = User::whereHas('company_user', function($q) use ($companyId) {
                $q->where('company_id', $companyId)->where('status', 'active');
            })->whereNull('manager_id');
            
            $topLevel = $query->get();
            
            return $topLevel->map(function($user) {
                return $this->formatUserNode($user);
            });
        }

        // Get direct reports for the specific manager
        $manager = User::whereHas('company_user', function($q) use ($companyId) {
            $q->where('company_id', $companyId)->where('status', 'active');
        })->find($managerId);

        if (!$manager) {
            return [];
        }

        return [$this->formatUserNode($manager)];
    }
    
    /**
     * Recursive user node formatting.
     */
    private function formatUserNode($user)
    {
        $node = [
            'id' => $user->id,
            'key' => $user->id,
            'name' => $user->name,
            'position' => $user->position,
            'email' => $user->email,
            'role_id' => $user->role_id,
            'children' => [],
        ];
        
        // Eager load direct reports if not loaded
        if (!$user->relationLoaded('directReports')) {
             $user->load('directReports');
        }

        foreach ($user->directReports as $report) {
            $node['children'][] = $this->formatUserNode($report);
        }
        
        return $node;
    }
}
