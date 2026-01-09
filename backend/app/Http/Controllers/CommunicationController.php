<?php

namespace App\Http\Controllers;

use App\Models\Communication;
use Illuminate\Http\Request;

class CommunicationController extends Controller
{
    /**
     * Display communications for a customer or lead.
     */
    public function index(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = Communication::where('company_id', $companyId)
                ->with('user');

            // Filter by communicable (customer or lead)
            if ($request->has('communicable_type') && $request->has('communicable_id')) {
                $query->where('communicable_type', $request->input('communicable_type'))
                      ->where('communicable_id', $request->input('communicable_id'));
            }

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->input('type'));
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            $query->orderBy('created_at', 'desc');

            $perPage = $request->input('per_page', 20);
            $communications = $query->paginate($perPage);

            return response()->json($communications);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch communications: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created communication.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'communicable_type' => 'required|string|in:App\Models\Customer,App\Models\Lead',
                'communicable_id' => 'required|integer',
                'type' => 'required|in:call,email,meeting,note,sms,whatsapp,other',
                'subject' => 'nullable|string|max:255',
                'content' => 'required|string',
                'direction' => 'nullable|in:inbound,outbound',
                'scheduled_at' => 'nullable|date',
                'duration_minutes' => 'nullable|integer|min:0',
                'attachments' => 'nullable|array',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            $communicationData = [
                'company_id' => $companyId,
                'communicable_type' => $validated['communicable_type'],
                'communicable_id' => $validated['communicable_id'],
                'type' => $validated['type'],
                'content' => $validated['content'],
                'direction' => $validated['direction'] ?? 'outbound',
                'user_id' => auth()->id(),
                'status' => $validated['scheduled_at'] ? 'scheduled' : 'completed',
            ];

            if (isset($validated['subject'])) {
                $communicationData['subject'] = $validated['subject'];
            }
            if (isset($validated['scheduled_at'])) {
                $communicationData['scheduled_at'] = $validated['scheduled_at'];
            } else {
                $communicationData['completed_at'] = now();
            }
            if (isset($validated['duration_minutes'])) {
                $communicationData['duration_minutes'] = $validated['duration_minutes'];
            }
            if (isset($validated['attachments'])) {
                $communicationData['attachments'] = $validated['attachments'];
            }

            $communication = Communication::create($communicationData);

            // Update last_contact_date for customer/lead
            $communicable = $communication->communicable;
            if ($communicable && method_exists($communicable, 'update')) {
                $communicable->update(['last_contact_date' => now()]);
            }

            return response()->json([
                'message' => 'Communication logged successfully',
                'communication' => $communication->load('user')
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create communication: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified communication.
     */
    public function update(Request $request, $id)
    {
        try {
            $communication = Communication::findOrFail($id);

            $validated = $request->validate([
                'subject' => 'nullable|string|max:255',
                'content' => 'sometimes|required|string',
                'status' => 'sometimes|in:scheduled,completed,cancelled',
                'scheduled_at' => 'nullable|date',
                'completed_at' => 'nullable|date',
                'duration_minutes' => 'nullable|integer|min:0',
            ]);

            $communication->update($validated);

            return response()->json([
                'message' => 'Communication updated successfully',
                'communication' => $communication->load('user')
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update communication'], 500);
        }
    }

    /**
     * Remove the specified communication.
     */
    public function destroy($id)
    {
        try {
            $communication = Communication::findOrFail($id);
            $communication->delete();

            return response()->json(['message' => 'Communication deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete communication'], 500);
        }
    }
}



