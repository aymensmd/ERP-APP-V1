<?php

namespace App\Http\Controllers;

use App\Models\OnboardingChecklist;
use App\Models\User;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    /**
     * Get onboarding checklist for a user.
     */
    public function index(Request $request, $userId = null)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            $targetUserId = $userId ?? $request->input('user_id') ?? auth()->id();

            $checklist = OnboardingChecklist::where('company_id', $companyId)
                ->where('user_id', $targetUserId)
                ->with(['assignedTo', 'completedBy'])
                ->orderBy('order')
                ->orderBy('created_at')
                ->get();

            return response()->json($checklist);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch checklist: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create onboarding checklist for a new employee.
     */
    public function createChecklist(Request $request, $userId)
    {
        try {
            $validated = $request->validate([
                'tasks' => 'required|array|min:1',
                'tasks.*.task_name' => 'required|string|max:255',
                'tasks.*.description' => 'nullable|string',
                'tasks.*.category' => 'nullable|in:documentation,access,training,equipment,other',
                'tasks.*.due_date' => 'nullable|date',
                'tasks.*.assigned_to' => 'nullable|exists:users,id',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            $user = User::findOrFail($userId);
            $checklistItems = [];

            foreach ($validated['tasks'] as $index => $task) {
                $checklistItems[] = OnboardingChecklist::create([
                    'company_id' => $companyId,
                    'user_id' => $userId,
                    'task_name' => $task['task_name'],
                    'description' => $task['description'] ?? null,
                    'category' => $task['category'] ?? 'other',
                    'order' => $index,
                    'due_date' => $task['due_date'] ?? null,
                    'assigned_to' => $task['assigned_to'] ?? null,
                    'status' => 'pending',
                ]);
            }

            return response()->json([
                'message' => 'Onboarding checklist created successfully',
                'checklist' => $checklistItems
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create checklist: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update checklist item status.
     */
    public function updateItem(Request $request, $itemId)
    {
        try {
            $item = OnboardingChecklist::findOrFail($itemId);

            $validated = $request->validate([
                'status' => 'sometimes|in:pending,in_progress,completed,skipped',
                'notes' => 'nullable|string',
            ]);

            if (isset($validated['status'])) {
                if ($validated['status'] === 'completed' && $item->status !== 'completed') {
                    $validated['completed_date'] = now();
                    $validated['completed_by'] = auth()->id();
                } elseif ($validated['status'] !== 'completed') {
                    $validated['completed_date'] = null;
                    $validated['completed_by'] = null;
                }
            }

            $item->update($validated);

            return response()->json([
                'message' => 'Checklist item updated successfully',
                'item' => $item->load(['assignedTo', 'completedBy'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update item'], 500);
        }
    }

    /**
     * Add a new checklist item.
     */
    public function addItem(Request $request, $userId)
    {
        try {
            $validated = $request->validate([
                'task_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'nullable|in:documentation,access,training,equipment,other',
                'due_date' => 'nullable|date',
                'assigned_to' => 'nullable|exists:users,id',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            $maxOrder = OnboardingChecklist::where('company_id', $companyId)
                ->where('user_id', $userId)
                ->max('order') ?? 0;

            $item = OnboardingChecklist::create([
                'company_id' => $companyId,
                'user_id' => $userId,
                'task_name' => $validated['task_name'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'] ?? 'other',
                'order' => $maxOrder + 1,
                'due_date' => $validated['due_date'] ?? null,
                'assigned_to' => $validated['assigned_to'] ?? null,
                'status' => 'pending',
            ]);

            return response()->json([
                'message' => 'Checklist item added successfully',
                'item' => $item->load(['assignedTo'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to add item'], 500);
        }
    }

    /**
     * Delete a checklist item.
     */
    public function deleteItem($itemId)
    {
        try {
            $item = OnboardingChecklist::findOrFail($itemId);
            $item->delete();

            return response()->json(['message' => 'Checklist item deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete item'], 500);
        }
    }

    /**
     * Get default onboarding template.
     */
    public function getTemplate()
    {
        $template = [
            [
                'task_name' => 'Welcome Email Sent',
                'description' => 'Send welcome email to new employee',
                'category' => 'access',
            ],
            [
                'task_name' => 'Account Setup',
                'description' => 'Create system accounts and access credentials',
                'category' => 'access',
            ],
            [
                'task_name' => 'Employment Contract',
                'description' => 'Collect and verify employment contract',
                'category' => 'documentation',
            ],
            [
                'task_name' => 'ID Documents',
                'description' => 'Collect ID card and passport copies',
                'category' => 'documentation',
            ],
            [
                'task_name' => 'Equipment Assignment',
                'description' => 'Assign laptop, phone, and other equipment',
                'category' => 'equipment',
            ],
            [
                'task_name' => 'Orientation Session',
                'description' => 'Schedule and conduct orientation session',
                'category' => 'training',
            ],
            [
                'task_name' => 'Department Introduction',
                'description' => 'Introduce to team members and department',
                'category' => 'training',
            ],
        ];

        return response()->json($template);
    }
}



