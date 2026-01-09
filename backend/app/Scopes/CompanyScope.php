<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class CompanyScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $builder
     * @param  \Illuminate\Database\Eloquent\Model  $model
     * @return void
     */
    public function apply(Builder $builder, Model $model)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        
        if ($companyId) {
            $builder->where('company_id', $companyId);
        }
    }

    /**
     * Extend the query builder with the needed functions.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $builder
     * @return void
     */
    public function extend(Builder $builder)
    {
        $builder->macro('withoutCompany', function (Builder $builder) {
            return $builder->withoutGlobalScope($this);
        });

        $builder->macro('withAnyCompany', function (Builder $builder) {
            return $builder->withoutGlobalScope($this);
        });
    }
}




