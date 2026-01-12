<?php

namespace App\Exceptions;

use Exception;

class TenantContextMissingException extends Exception
{
    /**
     * Render the exception as an HTTP response.
     */
    public function render($request)
    {
        return response()->json([
            'error' => 'Tenant context is required',
            'message' => $this->getMessage() ?: 'No tenant context was found in the request. Please provide a valid X-Company-ID header, subdomain, or domain.',
        ], 400);
    }

    /**
     * Report the exception.
     */
    public function report()
    {
        // Log the exception for monitoring
        \Log::warning('Tenant context missing', [
            'url' => request()->fullUrl(),
            'ip' => request()->ip(),
            'user_id' => auth()->id(),
        ]);
    }
}
