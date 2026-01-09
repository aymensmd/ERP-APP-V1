<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers.
     */
    public function index(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = Customer::where('company_id', $companyId)
                ->with(['assignedTo', 'createdBy', 'lead']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->input('type'));
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
            $customers = $query->paginate($perPage);

            return response()->json($customers);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch customers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created customer.
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
                'type' => 'nullable|in:individual,business',
                'status' => 'nullable|in:active,inactive,suspended',
                'tax_id' => 'nullable|string|max:255',
                'billing_address' => 'nullable|string',
                'shipping_address' => 'nullable|string',
                'website' => 'nullable|url|max:255',
                'credit_limit' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
                'assigned_to' => 'nullable|exists:users,id',
                'lead_id' => 'nullable|exists:leads,id',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }
            
            if (!auth()->check()) {
                return response()->json(['error' => 'Authentication required'], 401);
            }

            $customerData = [
                'company_id' => $companyId,
                'created_by' => auth()->id(),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'type' => $validated['type'] ?? 'individual',
                'status' => $validated['status'] ?? 'active',
                'first_contact_date' => now(),
            ];
            
            // Add optional fields
            foreach (['email', 'phone', 'company_name', 'job_title', 'industry', 'tax_id', 
                     'billing_address', 'shipping_address', 'website', 'credit_limit', 
                     'notes', 'assigned_to', 'lead_id'] as $field) {
                if (isset($validated[$field]) && $validated[$field] !== null) {
                    $customerData[$field] = $validated[$field];
                }
            }

            $customer = Customer::create($customerData);

            // If converted from lead, update lead status
            if (isset($validated['lead_id'])) {
                $lead = Lead::find($validated['lead_id']);
                if ($lead && $lead->status !== 'converted') {
                    $lead->update([
                        'status' => 'converted',
                        'converted_at' => now(),
                    ]);
                }
            }

            return response()->json([
                'message' => 'Customer created successfully',
                'customer' => $customer->load(['assignedTo', 'createdBy', 'lead'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Customer creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'error' => 'Failed to create customer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified customer.
     */
    public function show($id)
    {
        try {
            $customer = Customer::with([
                'assignedTo',
                'createdBy',
                'lead',
                'communications.user',
                'invoices'
            ])->findOrFail($id);
            
            return response()->json($customer);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Customer not found'], 404);
        }
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, $id)
    {
        try {
            $customer = Customer::findOrFail($id);

            $validated = $request->validate([
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:255',
                'company_name' => 'nullable|string|max:255',
                'job_title' => 'nullable|string|max:255',
                'industry' => 'nullable|string|max:255',
                'type' => 'nullable|in:individual,business',
                'status' => 'sometimes|in:active,inactive,suspended',
                'tax_id' => 'nullable|string|max:255',
                'billing_address' => 'nullable|string',
                'shipping_address' => 'nullable|string',
                'website' => 'nullable|url|max:255',
                'credit_limit' => 'nullable|numeric|min:0',
                'notes' => 'nullable|string',
                'assigned_to' => 'nullable|exists:users,id',
            ]);

            $customer->update($validated);

            return response()->json([
                'message' => 'Customer updated successfully',
                'customer' => $customer->load(['assignedTo', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update customer: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified customer.
     */
    public function destroy($id)
    {
        try {
            $customer = Customer::findOrFail($id);
            $customer->delete();

            return response()->json(['message' => 'Customer deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete customer'], 500);
        }
    }

    /**
     * Convert a lead to a customer.
     */
    public function convertFromLead(Request $request, $leadId)
    {
        try {
            $lead = Lead::findOrFail($leadId);
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $customer = Customer::create([
                'company_id' => $companyId,
                'lead_id' => $lead->id,
                'first_name' => $lead->first_name,
                'last_name' => $lead->last_name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'company_name' => $lead->company_name,
                'job_title' => $lead->job_title,
                'industry' => $lead->industry,
                'assigned_to' => $lead->assigned_to,
                'created_by' => auth()->id(),
                'first_contact_date' => $lead->contacted_at ?? now(),
                'status' => 'active',
                'type' => $lead->company_name ? 'business' : 'individual',
            ]);

            // Update lead status
            $lead->update([
                'status' => 'converted',
                'converted_at' => now(),
            ]);

            return response()->json([
                'message' => 'Lead converted to customer successfully',
                'customer' => $customer->load(['assignedTo', 'createdBy', 'lead'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to convert lead: ' . $e->getMessage()], 500);
        }
    }
}



