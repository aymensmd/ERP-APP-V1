<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AttendanceRecord;
use App\Models\ShiftAssignment;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\CompanySetting;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
        if (!$companyId) {
            return response()->json(['error' => 'Company context required'], 400);
        }

        $user = $request->user();
        $canView = method_exists($user, 'hasPermissionInCompany') 
            && (
                $user->hasPermissionInCompany('attendance.view', $companyId) 
                || $user->hasPermissionInCompany('time-tracking.view', $companyId)
            );

        $query = AttendanceRecord::query()->where('company_id', $companyId);

        if ($canView) {
            if ($request->filled('user_id')) {
                $query->where('user_id', (int)$request->get('user_id'));
            }
        } else {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->get('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->get('date_to'));
        }

        $records = $query->orderBy('date', 'desc')->paginate(50);
        return response()->json($records);
    }

    public function clockIn(Request $request)
    {
        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
        if (!$companyId) {
            return response()->json(['error' => 'Company context required'], 400);
        }

        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        $record = AttendanceRecord::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($record && $record->clock_in_time) {
            return response()->json(['error' => 'Already clocked in'], 400);
        }

        $status = 'present';

        $assignment = ShiftAssignment::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('assignment_date', $today)
            ->first();

        $expectedStart = null;
        if ($assignment) {
            $expectedStart = $assignment->start_time;
            if (!$expectedStart) {
                $shift = Shift::find($assignment->shift_id);
                if ($shift) {
                    $expectedStart = $shift->start_time;
                }
            }
        }

        if ($expectedStart) {
            $expectedStartTs = Carbon::parse($today . ' ' . $expectedStart);
            if ($now->gt($expectedStartTs)) {
                $status = 'late';
            }
        }

        if (!$record) {
            $record = new AttendanceRecord([
                'company_id' => $companyId,
                'user_id' => $user->id,
                'date' => $today,
            ]);
        }

        $record->clock_in_time = $now;
        $record->status = $status;
        $record->save();

        return response()->json($record);
    }

    public function clockOut(Request $request)
    {
        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
        if (!$companyId) {
            return response()->json(['error' => 'Company context required'], 400);
        }

        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $now = Carbon::now();

        $record = AttendanceRecord::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (!$record || !$record->clock_in_time) {
            return response()->json(['error' => 'No clock-in found'], 400);
        }

        if ($record->clock_out_time) {
            return response()->json(['error' => 'Already clocked out'], 400);
        }

        $assignment = ShiftAssignment::where('company_id', $companyId)
            ->where('user_id', $user->id)
            ->where('assignment_date', $today)
            ->first();

        $expectedEnd = null;
        if ($assignment) {
            $expectedEnd = $assignment->end_time;
            if (!$expectedEnd) {
                $shift = Shift::find($assignment->shift_id);
                if ($shift) {
                    $expectedEnd = $shift->end_time;
                }
            }
        }

        // Get Company Settings for Overtime
        $minOvertimeMinutes = CompanySetting::where('company_id', $companyId)
            ->where('key', 'overtime_min_minutes')
            ->value('value') ?? 30; // Default 30 mins

        $overtime = 0;
        if ($expectedEnd) {
            $expectedEndTs = Carbon::parse($today . ' ' . $expectedEnd);
            if ($now->gt($expectedEndTs)) {
                $diff = $expectedEndTs->diffInMinutes($now);
                // Apply Rule: Only count if greater than threshold
                if ($diff >= $minOvertimeMinutes) {
                    $overtime = $diff;
                }
            }
        }

        $record->clock_out_time = $now;
        $record->overtime_minutes = $overtime;
        $record->save();

        return response()->json($record);
    }

    public function approve(Request $request, $id)
    {
        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
        if (!$companyId) {
            return response()->json(['error' => 'Company context required'], 400);
        }

        $record = AttendanceRecord::where('company_id', $companyId)->where('id', $id)->first();
        if (!$record) {
            return response()->json(['error' => 'Record not found'], 404);
        }

        $record->approved_by = $request->user()->id;
        $record->approved_at = Carbon::now();
        $record->save();

        return response()->json($record);
    }
}
