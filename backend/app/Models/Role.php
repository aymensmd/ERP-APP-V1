<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Role extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'name',
        'slug',
        'description',
    ];

    /**
     * Get the users for the role.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the permissions for the role.
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permission')
                    ->withTimestamps();
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission($permissionName)
    {
        return $this->permissions()->where('name', $permissionName)->exists();
    }

    /**
     * Assign a permission to the role.
     */
    public function givePermissionTo($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }
        
        if ($permission && !$this->hasPermission($permission->name)) {
            return $this->permissions()->attach($permission);
        }
        
        return false;
    }

    /**
     * Remove a permission from the role.
     */
    public function revokePermissionTo($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->first();
        }
        
        if ($permission) {
            return $this->permissions()->detach($permission);
        }
        
        return false;
    }
}


