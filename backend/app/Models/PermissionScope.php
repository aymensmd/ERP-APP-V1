<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermissionScope extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_id',
        'permission_id',
        'scope',
        'notes',
    ];

    protected $casts = [
        'scope' => 'string',
    ];

    /**
     * Get the user that owns the permission scope.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the company that the permission scope belongs to.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the permission.
     */
    public function permission()
    {
        return $this->belongsTo(Permission::class);
    }
}
