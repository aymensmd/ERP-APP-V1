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
}

