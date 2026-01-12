<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\HierarchyService;
use App\Models\User;

class HierarchyController extends Controller
{
    protected $hierarchyService;

    public function __construct(HierarchyService $hierarchyService)
    {
        $this->hierarchyService = $hierarchyService;
    }

    /**
     * Get the full organizational chart (departments + users).
     */
    public function index(Request $request)
    {
        $companyId = $request->attributes->get('current_company_id');
        $tree = $this->hierarchyService->getOrganizationTree($companyId);
        
        return response()->json($tree);
    }

    /**
     * Get the current user's reporting team (subordinates).
     */
    public function myTeam(Request $request)
    {
        $user = $request->user();
        $companyId = $request->attributes->get('current_company_id');
        
        // Ensure user belongs to company
        if (!$user->belongsToCompany($companyId)) {
             return response()->json(['error' => 'Forbidden'], 403);
        }

        $tree = $this->hierarchyService->getReportingTree($user->id, $companyId);
        
        return response()->json($tree);
    }
}
