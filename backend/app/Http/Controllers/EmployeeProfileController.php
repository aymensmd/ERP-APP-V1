<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmployeeDocument;
use App\Models\EmployeeSkill;
use App\Models\EmployeeCertification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class EmployeeProfileController extends Controller
{
    /**
     * Get employee profile with documents, skills, and certifications.
     */
    public function show($userId)
    {
        try {
            $user = User::with([
                'documents',
                'skills',
                'certifications',
                'department',
                'role',
                'manager'
            ])->findOrFail($userId);

            return response()->json([
                'user' => $user,
                'documents' => $user->documents,
                'skills' => $user->skills,
                'certifications' => $user->certifications,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Employee not found'], 404);
        }
    }

    /**
     * Upload a document for an employee.
     */
    public function uploadDocument(Request $request, $userId)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'type' => 'required|string|max:255',
                'file' => 'required|file|max:10240', // 10MB max
                'expiry_date' => 'nullable|date',
                'description' => 'nullable|string',
                'is_confidential' => 'boolean',
            ]);

            $user = User::findOrFail($userId);
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('documents/' . $userId, $fileName, 'public');

            $document = EmployeeDocument::create([
                'company_id' => $companyId,
                'user_id' => $userId,
                'name' => $validated['name'],
                'type' => $validated['type'],
                'file_path' => $filePath,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'expiry_date' => $validated['expiry_date'] ?? null,
                'description' => $validated['description'] ?? null,
                'is_confidential' => $validated['is_confidential'] ?? false,
            ]);

            return response()->json([
                'message' => 'Document uploaded successfully',
                'document' => $document
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to upload document: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a document.
     */
    public function deleteDocument($documentId)
    {
        try {
            $document = EmployeeDocument::findOrFail($documentId);
            
            // Delete file from storage
            if (Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            return response()->json(['message' => 'Document deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete document'], 500);
        }
    }

    /**
     * Add a skill to an employee.
     */
    public function addSkill(Request $request, $userId)
    {
        try {
            $validated = $request->validate([
                'skill_name' => 'required|string|max:255',
                'category' => 'nullable|string|max:255',
                'proficiency' => 'required|in:beginner,intermediate,advanced,expert',
                'years_of_experience' => 'nullable|integer|min:0',
                'acquired_date' => 'nullable|date',
                'description' => 'nullable|string',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $skill = EmployeeSkill::create([
                'company_id' => $companyId,
                'user_id' => $userId,
                ...$validated
            ]);

            return response()->json([
                'message' => 'Skill added successfully',
                'skill' => $skill
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to add skill: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a skill.
     */
    public function updateSkill(Request $request, $skillId)
    {
        try {
            $skill = EmployeeSkill::findOrFail($skillId);
            
            $validated = $request->validate([
                'skill_name' => 'sometimes|required|string|max:255',
                'category' => 'nullable|string|max:255',
                'proficiency' => 'sometimes|required|in:beginner,intermediate,advanced,expert',
                'years_of_experience' => 'nullable|integer|min:0',
                'acquired_date' => 'nullable|date',
                'description' => 'nullable|string',
            ]);

            $skill->update($validated);

            return response()->json([
                'message' => 'Skill updated successfully',
                'skill' => $skill
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update skill'], 500);
        }
    }

    /**
     * Delete a skill.
     */
    public function deleteSkill($skillId)
    {
        try {
            $skill = EmployeeSkill::findOrFail($skillId);
            $skill->delete();

            return response()->json(['message' => 'Skill deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete skill'], 500);
        }
    }

    /**
     * Add a certification to an employee.
     */
    public function addCertification(Request $request, $userId)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'issuing_organization' => 'required|string|max:255',
                'certificate_number' => 'nullable|string|max:255',
                'issue_date' => 'required|date',
                'expiry_date' => 'nullable|date|after:issue_date',
                'credential_url' => 'nullable|url',
                'file' => 'nullable|file|max:10240',
                'description' => 'nullable|string',
                'does_not_expire' => 'boolean',
            ]);

            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $data = [
                'company_id' => $companyId,
                'user_id' => $userId,
                'name' => $validated['name'],
                'issuing_organization' => $validated['issuing_organization'],
                'certificate_number' => $validated['certificate_number'] ?? null,
                'issue_date' => $validated['issue_date'],
                'expiry_date' => $validated['expiry_date'] ?? null,
                'credential_url' => $validated['credential_url'] ?? null,
                'description' => $validated['description'] ?? null,
                'does_not_expire' => $validated['does_not_expire'] ?? false,
            ];

            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('certifications/' . $userId, $fileName, 'public');
                $data['file_path'] = $filePath;
            }

            $certification = EmployeeCertification::create($data);

            return response()->json([
                'message' => 'Certification added successfully',
                'certification' => $certification
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to add certification: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a certification.
     */
    public function updateCertification(Request $request, $certificationId)
    {
        try {
            $certification = EmployeeCertification::findOrFail($certificationId);
            
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'issuing_organization' => 'sometimes|required|string|max:255',
                'certificate_number' => 'nullable|string|max:255',
                'issue_date' => 'sometimes|required|date',
                'expiry_date' => 'nullable|date|after:issue_date',
                'credential_url' => 'nullable|url',
                'file' => 'nullable|file|max:10240',
                'description' => 'nullable|string',
                'does_not_expire' => 'boolean',
            ]);

            if ($request->hasFile('file')) {
                // Delete old file
                if ($certification->file_path && Storage::disk('public')->exists($certification->file_path)) {
                    Storage::disk('public')->delete($certification->file_path);
                }

                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('certifications/' . $certification->user_id, $fileName, 'public');
                $validated['file_path'] = $filePath;
            }

            $certification->update($validated);

            return response()->json([
                'message' => 'Certification updated successfully',
                'certification' => $certification
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update certification'], 500);
        }
    }

    /**
     * Delete a certification.
     */
    public function deleteCertification($certificationId)
    {
        try {
            $certification = EmployeeCertification::findOrFail($certificationId);
            
            // Delete file if exists
            if ($certification->file_path && Storage::disk('public')->exists($certification->file_path)) {
                Storage::disk('public')->delete($certification->file_path);
            }

            $certification->delete();

            return response()->json(['message' => 'Certification deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete certification'], 500);
        }
    }

    /**
     * Get organizational hierarchy.
     */
    public function getOrganizationalChart()
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            // Get all users in the company
            $users = DB::table('company_user')
                ->where('company_id', $companyId)
                ->where('status', 'active')
                ->join('users', 'company_user.user_id', '=', 'users.id')
                ->select('users.*', 'company_user.department_id', 'company_user.role_id')
                ->get()
                ->map(function($user) {
                    return (array) $user;
                });

            // Build hierarchy
            $hierarchy = $this->buildHierarchy($users);

            return response()->json($hierarchy);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to build organizational chart: ' . $e->getMessage()], 500);
        }
    }

    private function buildHierarchy($users)
    {
        $userMap = [];
        $roots = [];

        // Create map of users
        foreach ($users as $user) {
            $userMap[$user['id']] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'position' => $user['job_title'] ?? 'Employee',
                'department_id' => $user['department_id'],
                'role_id' => $user['role_id'],
                'children' => []
            ];
        }

        // Build tree
        foreach ($users as $user) {
            if ($user['manager_id']) {
                if (isset($userMap[$user['manager_id']])) {
                    $userMap[$user['manager_id']]['children'][] = &$userMap[$user['id']];
                }
            } else {
                $roots[] = &$userMap[$user['id']];
            }
        }

        return $roots;
    }
}




