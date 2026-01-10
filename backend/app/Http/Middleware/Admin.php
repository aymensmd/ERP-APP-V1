<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Admin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Check if user is admin in the current company context
        $companyId = $request->attributes->get('current_company_id') ?? 
                     session('current_company_id') ?? 
                     ($request->header('X-Company-ID') ? (int)$request->header('X-Company-ID') : null);
        
        if (!$companyId) {
            return response()->json([
                'message' => 'Company context required.'
            ], 400);
        }
        
        // Check if user is admin in this company
        if (!$user->isAdminInCompany($companyId)) {
            return response()->json([
                'message' => 'Unauthorized. Admin access required in this company.'
            ], 403);
        }

        return $next($request);
    }
}

