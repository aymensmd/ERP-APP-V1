<?php

namespace App\Traits;

use App\Models\Company;
use App\Scopes\CompanyScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait HasCompany
{
    /**
     * Boot the trait.
     */
    protected static function bootHasCompany()
    {
        // Apply company scope automatically
        static::addGlobalScope(new \App\Scopes\CompanyScope);

        // Auto-populate company_id on creation
        static::creating(function ($model) {
            if (!$model->company_id) {
                $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
                if ($companyId) {
                    $model->company_id = $companyId;
                }
            }
        });

        // Prevent company_id changes on existing records
        static::updating(function ($model) {
            if ($model->isDirty('company_id') && $model->getOriginal('company_id')) {
                throw new \Exception('Cannot change company_id of existing record. Model: ' . get_class($model));
            }
        });
    }

    /**
     * Get the company that owns the model.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope a query to only include records for the current company.
     */
    public function scopeForCurrentCompany($query)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($companyId) {
            return $query->where('company_id', $companyId);
        }

        return $query;
    }

    /**
     * Scope a query to only include records for a specific company.
     */
    public function scopeForCompany($query, $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope a query to include records from all companies (bypass company scope).
     */
    public function scopeWithoutCompanyScope($query)
    {
        return $query->withoutGlobalScope(CompanyScope::class);
    }

    /**
     * Check if the model belongs to the current company.
     */
    public function belongsToCurrentCompany(): bool
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        return $this->company_id === $companyId;
    }

    /**
     * Get the current company ID from request/session.
     */
    public static function getCurrentCompanyId(): ?int
    {
        return request()->attributes->get('current_company_id') ?? session('current_company_id');
    }
}

