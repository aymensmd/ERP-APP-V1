<?php

namespace App\Traits;

use App\Models\User;

trait HasHierarchy
{
    /**
     * Get all subordinates (direct and indirect reports).
     */
    public function allSubordinates()
    {
        return User::whereIn('id', $this->getSubordinateIds())->get();
    }
    
    /**
     * Get direct reports only.
     */
    public function directReports()
    {
        return $this->hasMany(User::class, 'manager_id');
    }
    
    /**
     * Check if user is subordinate of given manager.
     */
    public function isSubordinateOf(User $manager): bool
    {
        $currentManager = $this->manager;
        while ($currentManager) {
            if ($currentManager->id === $manager->id) {
                return true;
            }
            $currentManager = $currentManager->manager;
        }
        return false;
    }
    
    /**
     * Check if user is manager of given employee.
     */
    public function isManagerOf(User $employee): bool
    {
        return $employee->isSubordinateOf($this);
    }
    
    /**
     * Get all subordinate user IDs (recursive).
     */
    public function getSubordinateIds(): array
    {
        static $cache = [];
        $cacheKey = 'subordinates_' . $this->id;
        
        if (isset($cache[$cacheKey])) {
            return $cache[$cacheKey];
        }
        
        $subordinates = $this->getSubordinatesRecursive($this->id);
        $cache[$cacheKey] = $subordinates;
        
        return $subordinates;
    }
    
    /**
     * Get subordinates recursively.
     */
    private function getSubordinatesRecursive($managerId): array
    {
        $subordinates = User::where('manager_id', $managerId)->pluck('id')->toArray();
        
        foreach ($subordinates as $subordinateId) {
            $nested = $this->getSubordinatesRecursive($subordinateId);
            $subordinates = array_merge($subordinates, $nested);
        }
        
        return array_unique($subordinates);
    }
    
    /**
     * Scope query to include user and all their subordinates.
     */
    public function scopeWithSubordinates($query, User $user)
    {
        $subordinateIds = $user->getSubordinateIds();
        $subordinateIds[] = $user->id; // Include self
        
        return $query->whereIn('id', $subordinateIds);
    }
    
    /**
     * Scope to filter by accessible users based on permission scope.
     */
    public function scopeAccessibleBy($query, User $user, string $permission)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        $scope = $user->getPermissionScope($permission, $companyId);
        
        if (!$scope) {
            return $query->whereRaw('1 = 0'); // No access
        }
        
        return match($scope) {
            'self' => $query->where('id', $user->id),
            'department' => $query->where('department_id', $user->department_id),
            'company' => $query, // Tenant scope handles company filtering
            default => $query->whereRaw('1 = 0'),
        };
    }
}
