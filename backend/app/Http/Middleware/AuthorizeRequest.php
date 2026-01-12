<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthorizeRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $permission
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        $user = Auth::user();
        $companyId = $request->attributes->get('current_company_id');
        
        if (!$user->hasPermissionInCompany($permission, $companyId)) {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'You do not have permission to perform this action.',
            ], 403);
        }
        
        // Store permission scope in request for controllers to use if needed
        $scope = $user->getPermissionScope($permission, $companyId);
        $request->attributes->set('permission_scope', $scope);
        
        return $next($request);
    }
}
