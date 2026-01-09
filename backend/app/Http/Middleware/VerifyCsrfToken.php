<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Exclude API routes from CSRF since we're using token-based authentication
        'api/login',
        'api/register',
        'api/*',
    ];
    
    /**
     * Determine if the request should be excluded from CSRF verification.
     */
    protected function inExceptArray($request)
    {
        // For API routes, skip CSRF if using Bearer token
        if ($request->is('api/*') && $request->bearerToken()) {
            return true;
        }
        
        return parent::inExceptArray($request);
    }
}
