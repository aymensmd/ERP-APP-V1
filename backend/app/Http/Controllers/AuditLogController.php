<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs.
     */
    public function index(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = AuditLog::where('company_id', $companyId)
                ->with(['user', 'model'])
                ->orderBy('created_at', 'desc');

            // Filter by model type
            if ($request->has('model_type')) {
                $query->where('model_type', $request->input('model_type'));
            }

            // Filter by model ID
            if ($request->has('model_id')) {
                $query->where('model_id', $request->input('model_id'));
            }

            // Filter by user
            if ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            // Filter by action
            if ($request->has('action')) {
                $query->where('action', $request->input('action'));
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->input('start_date'));
            }

            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->input('end_date'));
            }

            $logs = $query->paginate($request->input('per_page', 50));

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch audit logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified audit log.
     */
    public function show($id)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $log = AuditLog::where('company_id', $companyId)
                ->with(['user', 'model'])
                ->findOrFail($id);

            return response()->json($log);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Audit log not found'], 404);
        }
    }

    /**
     * Get audit logs for a specific model.
     */
    public function forModel(Request $request, $modelType, $modelId)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $logs = AuditLog::where('company_id', $companyId)
                ->where('model_type', $modelType)
                ->where('model_id', $modelId)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch audit logs: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export audit logs.
     */
    public function export(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');

            $query = AuditLog::where('company_id', $companyId)
                ->with('user')
                ->orderBy('created_at', 'desc');

            // Apply filters (same as index method)
            if ($request->has('model_type')) {
                $query->where('model_type', $request->input('model_type'));
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->input('start_date'));
            }

            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->input('end_date'));
            }

            $logs = $query->get();

            // Format for export
            $exportData = $logs->map(function($log) {
                return [
                    'ID' => $log->id,
                    'User' => $log->user->name ?? 'System',
                    'Model Type' => class_basename($log->model_type),
                    'Model ID' => $log->model_id,
                    'Action' => ucfirst($log->action),
                    'Changes' => json_encode($log->changes ?? []),
                    'IP Address' => $log->ip_address,
                    'URL' => $log->url,
                    'Method' => $log->method,
                    'Date' => $log->created_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'data' => $exportData,
                'total' => $exportData->count(),
                'exported_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to export audit logs: ' . $e->getMessage()], 500);
        }
    }
}




