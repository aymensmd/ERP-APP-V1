<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Detect tenant from various sources
        $company = $this->detectTenant($request);

        if (!$company) {
            // If no company found and user is authenticated, try to get user's default company
            if (Auth::check()) {
                $user = Auth::user();
                $companyUser = \DB::table('company_user')
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->first();
                
                if ($companyUser) {
                    $company = Company::find($companyUser->company_id);
                }
            }

            // If still no company, return error for protected routes
            if (!$company && $request->is('api/*')) {
                return response()->json([
                    'error' => 'Company context required. Please specify company via header, subdomain, or domain.'
                ], 400);
            }
        }

        // Set current company in request and session
        if ($company) {
            $request->attributes->set('current_company', $company);
            $request->attributes->set('current_company_id', $company->id);
            session(['current_company_id' => $company->id]);
            
            // Set app locale and timezone based on company settings
            if ($company->language) {
                app()->setLocale($company->language);
            }
            if ($company->timezone) {
                config(['app.timezone' => $company->timezone]);
            }
        }

        return $next($request);
    }

    /**
     * Detect tenant from request.
     */
    private function detectTenant(Request $request)
    {
        // Priority 1: Check X-Company-ID header
        if ($request->hasHeader('X-Company-ID')) {
            $companyId = $request->header('X-Company-ID');
            return Company::where('id', $companyId)->where('is_active', true)->first();
        }

        // Priority 2: Check X-Company-Slug header
        if ($request->hasHeader('X-Company-Slug')) {
            $slug = $request->header('X-Company-Slug');
            return Company::where('slug', $slug)->where('is_active', true)->first();
        }

        // Priority 3: Check subdomain
        $host = $request->getHost();
        $subdomain = explode('.', $host)[0];
        if ($subdomain && $subdomain !== 'www' && $subdomain !== 'api') {
            $company = Company::where('slug', $subdomain)->where('is_active', true)->first();
            if ($company) {
                return $company;
            }
        }

        // Priority 4: Check custom domain
        $company = Company::where('domain', $host)->where('is_active', true)->first();
        if ($company) {
            return $company;
        }

        // Priority 5: Check session
        if (session()->has('current_company_id')) {
            return Company::where('id', session('current_company_id'))
                         ->where('is_active', true)
                         ->first();
        }

        return null;
    }
}




