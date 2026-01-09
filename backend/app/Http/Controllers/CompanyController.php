<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies (for super admin only).
     */
    public function index(Request $request)
    {
        try {
            $query = Company::query();

            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('slug', 'like', "%{$search}%");
                });
            }

            if ($request->has('status')) {
                $query->where('subscription_status', $request->input('status'));
            }

            $companies = $query->orderBy('created_at', 'desc')->paginate(20);

            return response()->json($companies);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch companies: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created company.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'timezone' => 'nullable|string|default:UTC',
                'currency' => 'nullable|string|default:USD',
                'language' => 'nullable|string|default:en',
                'domain' => 'nullable|string|unique:companies,domain',
            ]);

            // Generate unique slug
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (Company::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            $company = Company::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'timezone' => $validated['timezone'] ?? 'UTC',
                'currency' => $validated['currency'] ?? 'USD',
                'language' => $validated['language'] ?? 'en',
                'domain' => $validated['domain'] ?? null,
                'subscription_status' => 'trial',
                'trial_ends_at' => now()->addDays(30),
                'is_active' => true,
            ]);

            // If user is authenticated, add them to the company as admin
            if (auth()->check()) {
                DB::table('company_user')->insert([
                    'company_id' => $company->id,
                    'user_id' => auth()->id(),
                    'role_id' => 1, // Admin
                    'status' => 'active',
                    'joined_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return response()->json([
                'message' => 'Company created successfully',
                'company' => $company
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create company: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified company.
     */
    public function show($id)
    {
        try {
            $company = Company::with(['users', 'departments'])->findOrFail($id);
            return response()->json($company);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Company not found'], 404);
        }
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, $id)
    {
        try {
            $company = Company::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'logo' => 'nullable|string',
                'timezone' => 'nullable|string',
                'currency' => 'nullable|string',
                'language' => 'nullable|string',
                'domain' => 'nullable|string|unique:companies,domain,' . $id,
                'settings' => 'nullable|array',
                'is_active' => 'sometimes|boolean',
            ]);

            $company->update($validated);

            return response()->json([
                'message' => 'Company updated successfully',
                'company' => $company
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update company: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified company.
     */
    public function destroy($id)
    {
        try {
            $company = Company::findOrFail($id);
            $company->delete(); // Will cascade delete due to foreign keys

            return response()->json(['message' => 'Company deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete company: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Switch to a different company.
     */
    public function switchCompany(Request $request, $companyId)
    {
        try {
            $user = auth()->user();
            
            // Check if user belongs to this company
            $companyUser = DB::table('company_user')
                ->where('user_id', $user->id)
                ->where('company_id', $companyId)
                ->where('status', 'active')
                ->first();

            if (!$companyUser) {
                return response()->json(['error' => 'You do not have access to this company'], 403);
            }

            $company = Company::findOrFail($companyId);

            // Set company in session
            session(['current_company_id' => $company->id]);

            return response()->json([
                'message' => 'Company switched successfully',
                'company' => $company
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to switch company: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get user's companies.
     */
    public function myCompanies(Request $request)
    {
        try {
            $user = auth()->user();
            
            $companies = $user->companies()
                ->wherePivot('status', 'active')
                ->withPivot(['role_id', 'department_id', 'joined_at'])
                ->get();

            return response()->json($companies);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch companies: ' . $e->getMessage()], 500);
        }
    }
}




