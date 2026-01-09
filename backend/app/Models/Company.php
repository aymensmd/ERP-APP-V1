<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'domain',
        'email',
        'phone',
        'address',
        'logo',
        'settings',
        'subscription_plan',
        'subscription_status',
        'trial_ends_at',
        'subscription_ends_at',
        'timezone',
        'currency',
        'language',
        'is_active',
    ];

    protected $casts = [
        'settings' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($company) {
            if (empty($company->slug)) {
                $company->slug = Str::slug($company->name);
            }
        });
    }

    /**
     * Get the users for the company.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'company_user')
                    ->withPivot(['role_id', 'department_id', 'status', 'joined_at', 'left_at', 'permissions'])
                    ->withTimestamps();
    }

    /**
     * Get the departments for the company.
     */
    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Get the events for the company.
     */
    public function events()
    {
        return $this->hasMany(Event::class);
    }

    /**
     * Get the vacations for the company.
     */
    public function vacations()
    {
        return $this->hasMany(Vacation::class);
    }

    /**
     * Get the audit logs for the company.
     */
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    /**
     * Check if company is on trial.
     */
    public function isOnTrial()
    {
        return $this->subscription_status === 'trial' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isFuture();
    }

    /**
     * Check if company has active subscription.
     */
    public function hasActiveSubscription()
    {
        return $this->subscription_status === 'active' && 
               ($this->subscription_ends_at === null || $this->subscription_ends_at->isFuture());
    }

    /**
     * Get company setting.
     */
    public function getSetting($key, $default = null)
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * Set company setting.
     */
    public function setSetting($key, $value)
    {
        $settings = $this->settings ?? [];
        data_set($settings, $key, $value);
        $this->settings = $settings;
        $this->save();
    }
}




