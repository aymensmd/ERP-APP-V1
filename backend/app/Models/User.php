<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, \App\Traits\HasHierarchy;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'employee_id',
        'date_of_birth',
        'genre',
        'address',
        'phone_number',
        'sos_number',
        'social_situation',
        'department_id',
        'role_id',
        'manager_id',
        'position',
        'hire_date',
        'salary',
        'employment_type',
        'status',
        'notes',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'is_platform_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'salary' => 'decimal:2',
    ];

    /**
     * Get the department that the user belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the role that the user belongs to.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the vacations for the user.
     */
    public function vacations()
    {
        return $this->hasMany(Vacation::class);
    }

    /**
     * Get the events created by the user.
     */
    public function createdEvents()
    {
        return $this->hasMany(Event::class, 'created_by');
    }

    /**
     * Get the events that the user is participating in.
     */
    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_participant', 'user_id', 'event_id')
                    ->withTimestamps();
    }

    /**
     * Get the vacations approved by the user.
     */
    public function approvedVacations()
    {
        return $this->hasMany(Vacation::class, 'approved_by');
    }

    /**
     * Get the companies that the user belongs to.
     */
    public function companies()
    {
        return $this->belongsToMany(Company::class, 'company_user')
                    ->withPivot(['role_id', 'department_id', 'status', 'joined_at', 'left_at', 'permissions'])
                    ->withTimestamps();
    }

    /**
     * Get the current company context.
     */
    public function currentCompany()
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($companyId) {
            return $this->companies()->where('companies.id', $companyId)->first();
        }

        return $this->companies()->wherePivot('status', 'active')->first();
    }

    /**
     * Get the user's role in a specific company.
     */
    public function roleInCompany($companyId)
    {
        $companyUser = \DB::table('company_user')
            ->where('user_id', $this->id)
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->first();

        return $companyUser ? Role::find($companyUser->role_id) : null;
    }

    /**
     * Check if user has permission in a specific company.
     */
    public function hasPermissionInCompany($permissionName, $companyId = null)
    {
        if (!$companyId) {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        }

        if (!$companyId) {
            return false;
        }

        // Platform Admin has global access
        if ($this->is_platform_admin) {
            return true;
        }

        // Check if user is admin (role_id === 1 in company_user)
        $companyUser = \DB::table('company_user')
            ->where('user_id', $this->id)
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->first();

        if (!$companyUser) {
            return false;
        }

        // Admin has all permissions
        if ($companyUser->role_id === 1) {
            return true;
        }

        // Check custom permissions override
        $customPermissions = json_decode($companyUser->permissions ?? '[]', true);
        if (in_array($permissionName, $customPermissions)) {
            return true;
        }

        // Check role permissions
        $hasPermission = \DB::table('role_permission')
            ->join('permissions', 'role_permission.permission_id', '=', 'permissions.id')
            ->where('role_permission.role_id', $companyUser->role_id)
            ->where('permissions.name', $permissionName)
            ->exists();

        return $hasPermission;
    }

    /**
     * Check if user is an admin in a specific company.
     */
    public function isAdminInCompany($companyId = null)
    {
        if (!$companyId) {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        }

        // Platform Admin is admin everywhere
        if ($this->is_platform_admin) {
            return true;
        }

        if (!$companyId) {
            return $this->role_id === 1; // Fallback to global role
        }


        $companyUser = \DB::table('company_user')
            ->where('user_id', $this->id)
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->where('role_id', 1)
            ->exists();

        return $companyUser;
    }

    /**
     * Get the manager of the user.
     */
    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get the direct reports (employees managed by this user).
     */
    public function directReports()
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    /**
     * Get all documents for the user.
     */
    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    /**
     * Get all skills for the user.
     */
    public function skills()
    {
        return $this->hasMany(EmployeeSkill::class);
    }

    /**
     * Get all certifications for the user.
     */
    public function certifications()
    {
        return $this->hasMany(EmployeeCertification::class);
    }

    /**
     * Get onboarding checklist items for the user.
     */
    public function onboardingChecklist()
    {
        return $this->hasMany(OnboardingChecklist::class);
    }

    /**
     * Get shift assignments for the user.
     */
    public function shiftAssignments()
    {
        return $this->hasMany(ShiftAssignment::class);
    }

    /**
     * Check if user is an admin (role_id === 1).
     *
     * @return bool
     */
    public function isAdmin()
    {
        return $this->is_platform_admin || $this->role_id === 1;
    }

    /**
     * Get the user's permission scopes for a company.
     */
    public function permissionScopes()
    {
        return $this->hasMany(\App\Models\PermissionScope::class);
    }

    /**
     * Get the user's scope for a specific permission.
     */
    public function getPermissionScope(string $permissionName, $companyId = null): ?string
    {
        if (!$companyId) {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        }

        if (!$companyId) {
            return null;
        }

        // Platform Admin has company scope for everything (effectively global within company context)
        if ($this->is_platform_admin) {
            return 'company';
        }

        // Admin has company scope for everything
        if ($this->isAdminInCompany($companyId)) {
            return 'company';
        }

        // Check for user-specific scope override
        $scopeOverride = \DB::table('permission_scopes')
            ->join('permissions', 'permission_scopes.permission_id', '=', 'permissions.id')
            ->where('permission_scopes.user_id', $this->id)
            ->where('permission_scopes.company_id', $companyId)
            ->where('permissions.name', $permissionName)
            ->value('permission_scopes.scope');

        if ($scopeOverride) {
            return $scopeOverride;
        }

        // Check role-based permission (default to 'self' if granted)
        $hasPermission = $this->hasPermissionInCompany($permissionName, $companyId);

        return $hasPermission ? 'self' : null;
    }

    /**
     * Check if user can access a specific record based on permission scope.
     */
    public function canAccess($model, string $permission): bool
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        $scope = $this->getPermissionScope($permission, $companyId);

        if (!$scope) {
            return false;
        }

        return match($scope) {
            'company' => true,
            'department' => $this->canAccessInDepartment($model),
            'self' => $this->canAccessOwn($model),
            default => false,
        };
    }

    /**
     * Check if user can access model in their department.
     */
    private function canAccessInDepartment($model): bool
    {
        if (isset($model->department_id)) {
            return $model->department_id === $this->department_id;
        }

        if (isset($model->user_id)) {
            $user = \App\Models\User::find($model->user_id);
            return $user && $user->department_id === $this->department_id;
        }

        return false;
    }

    /**
     * Check if user owns or is the model.
     */
    private function canAccessOwn($model): bool
    {
        // For User model
        if ($model instanceof User) {
            return $model->id === $this->id;
        }

        // Check various ownership patterns
        if (isset($model->user_id)) {
            return $model->user_id === $this->id;
        }

        if (isset($model->created_by)) {
            return $model->created_by === $this->id;
        }

        if (isset($model->assigned_to)) {
            return $model->assigned_to === $this->id;
        }

        return false;
    }
}
