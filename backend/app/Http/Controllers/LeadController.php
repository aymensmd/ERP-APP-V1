<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    /**
     * Display a listing of leads.
     */
    public function index(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = Lead::where('company_id', $companyId)
                ->with(['assignedTo', 'createdBy']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by source
            if ($request->has('source')) {
                $query->where('source', $request->input('source'));
            }

            // Filter by assigned_to
            if ($request->has('assigned_to')) {
                $query->where('assigned_to', $request->input('assigned_to'));
            }

            // Search
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('company_name', 'like', "%{$search}%");
                });
            }

            // Sort
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->input('per_page', 15);
            $leads = $query->paginate($perPage);

            return response()->json($leads);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch leads: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created lead.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'job_title' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'status' => 'nullable|in:new,contacted,qualified,converted,lost',
                'source' => 'nullable|in:website,referral,social_media,email,phone,other',
                'score' => 'nullable|integer|min:0|max:100',
                'estimated_value' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
                'assigned_to' => 'nullable|exists:users,id',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required. Please ensure you are logged in and have selected a company.'], 400);
            }
            
            if (!auth()->check()) {
                return response()->json(['error' => 'Authentication required'], 401);
            }

            $leadData = [
                'company_id' => $companyId,
                'created_by' => auth()->id(),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'status' => $validated['status'] ?? 'new',
                'source' => $validated['source'] ?? 'other',
                'score' => $validated['score'] ?? 0,
            ];
            
            // Add optional fields only if they exist
            if (isset($validated['email']) && $validated['email']) {
                $leadData['email'] = $validated['email'];
            }
            if (isset($validated['phone']) && $validated['phone']) {
                $leadData['phone'] = $validated['phone'];
            }
            if (isset($validated['company_name']) && $validated['company_name']) {
                $leadData['company_name'] = $validated['company_name'];
            }
            if (isset($validated['job_title']) && $validated['job_title']) {
                $leadData['job_title'] = $validated['job_title'];
            }
            if (isset($validated['industry']) && $validated['industry']) {
                $leadData['industry'] = $validated['industry'];
            }
            if (isset($validated['estimated_value']) && $validated['estimated_value']) {
                $leadData['estimated_value'] = $validated['estimated_value'];
            }
            if (isset($validated['notes']) && $validated['notes']) {
                $leadData['notes'] = $validated['notes'];
            }
            if (isset($validated['assigned_to']) && $validated['assigned_to']) {
                $leadData['assigned_to'] = $validated['assigned_to'];
            }

            $lead = Lead::create($leadData);

            return response()->json([
                'message' => 'Lead created successfully',
                'lead' => $lead->load(['assignedTo', 'createdBy'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Lead creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'error' => 'Failed to create lead: ' . $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Display the specified lead.
     */
    public function show($id)
    {
        try {
            $lead = Lead::with(['assignedTo', 'createdBy'])->findOrFail($id);
            return response()->json($lead);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Lead not found'], 404);
        }
    }

    /**
     * Update the specified lead.
     */
    public function update(Request $request, $id)
    {
        try {
            $lead = Lead::findOrFail($id);

            $validated = $request->validate([
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'job_title' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'status' => 'sometimes|in:new,contacted,qualified,converted,lost',
                'source' => 'nullable|in:website,referral,social_media,email,phone,other',
                'score' => 'nullable|integer|min:0|max:100',
                'estimated_value' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
                'assigned_to' => 'nullable|exists:users,id',
            ]);

            // Update contacted_at when status changes to contacted
            if (isset($validated['status']) && $validated['status'] === 'contacted' && $lead->status !== 'contacted') {
                $validated['contacted_at'] = now();
            }

            // Update converted_at when status changes to converted
            if (isset($validated['status']) && $validated['status'] === 'converted' && $lead->status !== 'converted') {
                $validated['converted_at'] = now();
            }

            $lead->update($validated);

            return response()->json([
                'message' => 'Lead updated successfully',
                'lead' => $lead->load(['assignedTo', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update lead: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified lead.
     */
    public function destroy($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            $lead->delete();

            return response()->json(['message' => 'Lead deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete lead'], 500);
        }
    }

    /**
     * Get lead statistics.
     */
    public function statistics()
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $stats = [
                'total' => Lead::where('company_id', $companyId)->count(),
                'new' => Lead::where('company_id', $companyId)->where('status', 'new')->count(),
                'contacted' => Lead::where('company_id', $companyId)->where('status', 'contacted')->count(),
                'qualified' => Lead::where('company_id', $companyId)->where('status', 'qualified')->count(),
                'converted' => Lead::where('company_id', $companyId)->where('status', 'converted')->count(),
                'lost' => Lead::where('company_id', $companyId)->where('status', 'lost')->count(),
                'total_value' => Lead::where('company_id', $companyId)->sum('estimated_value'),
                'avg_score' => Lead::where('company_id', $companyId)->avg('score'),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch statistics'], 500);
        }
    }
}


