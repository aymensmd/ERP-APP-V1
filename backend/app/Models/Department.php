<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Department extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'company_id',
        'parent_id',
        'manager_id',
        'order',
    ];

    /**
     * Get the users for the department.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get variable sub-departments (children).
     */
    public function children()
    {
        return $this->hasMany(Department::class, 'parent_id')->with('children')->orderBy('order');
    }

    /**
     * Get parent department.
     */
    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * Get department head / manager.
     */
    public function head()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Scope to get only root departments (no parent).
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }
}
