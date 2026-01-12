<?php

namespace App\Traits;

use App\Models\User;

trait HasAuthorization
{
    /**
     * Scope query based on user's access level for a permission.
     */
    public function scopeAuthorizedFor($query, User $user, string $permission)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        $scope = $user->getPermissionScope($permission, $companyId);
        
        if (!$scope) {
            return $query->whereRaw('1 = 0'); // No access
        }
        
        return match($scope) {
            'company' => $query,
            'department' => $this->scopeInUserDepartment($query, $user),
            'self' => $this->scopeOwnedBy($query, $user),
            default => $query->whereRaw('1 = 0'),
        };
    }
    
    /**
     * Scope to records in user's department.
     */
    public function scopeInUserDepartment($query, User $user)
    {
        $tableName = $this->getTable();
        
        // If model has department_id, filter directly
        if ($this->hasColumn('department_id')) {
            return $query->where($tableName . '.department_id', $user->department_id);
        }
        
        // If model has user_id, get all users in department
        if ($this->hasColumn('user_id')) {
            $departmentUserIds = User::where('department_id', $user->department_id)
                ->pluck('id')
                ->toArray();
            return $query->whereIn($tableName . '.user_id', $departmentUserIds);
        }
        
        // If model has assigned_to, check assignment
        if ($this->hasColumn('assigned_to')) {
            $departmentUserIds = User::where('department_id', $user->department_id)
                ->pluck('id')
                ->toArray();
            return $query->whereIn($tableName . '.assigned_to', $departmentUserIds);
        }
        
        // If model has created_by, check creator
        if ($this->hasColumn('created_by')) {
            $departmentUserIds = User::where('department_id', $user->department_id)
                ->pluck('id')
                ->toArray();
            return $query->whereIn($tableName . '.created_by', $departmentUserIds);
        }
        
        return $query;
    }
    
    /**
     * Scope to records owned by user.
     */
    public function scopeOwnedBy($query, User $user)
    {
        $tableName = $this->getTable();
        
        // Check various ownership patterns
        if ($this->hasColumn('user_id')) {
            return $query->where($tableName . '.user_id', $user->id);
        }
        
        if ($this->hasColumn('created_by')) {
            return $query->where($tableName . '.created_by', $user->id);
        }
        
        if ($this->hasColumn('assigned_to')) {
            return $query->where($tableName . '.assigned_to', $user->id);
        }
        
        // For User model, return self
        if ($this instanceof User) {
            return $query->where($tableName . '.id', $user->id);
        }
        
        return $query;
    }
    
    /**
     * Helper to check if table has a column.
     */
    protected function hasColumn(string $column): bool
    {
        return \Schema::hasColumn($this->getTable(), $column);
    }
}
