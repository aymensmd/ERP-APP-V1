<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AttendanceRecord;
use App\Models\Vacation;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function generate(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:attendance,payroll,performance',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $type = $request->input('type');
            $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
            $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();

            $data = match($type) {
                'attendance' => $this->generateAttendanceReport($startDate, $endDate),
                'payroll' => $this->generatePayrollReport($startDate, $endDate),
                'performance' => $this->generatePerformanceReport($startDate, $endDate),
                default => throw new \Exception('Invalid report type'),
            };

            return response()->json([
                'success' => true,
                'type' => $type,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'data' => $data,
                'generated_at' => Carbon::now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 400);
        }
    }

    private function generateAttendanceReport($startDate, $endDate)
    {
        $employees = User::with(['vacations', 'department'])
            ->get()
            ->map(function($user) use ($startDate, $endDate) {
                $vacations = $user->vacations()
                    ->whereBetween('start_date', [$startDate, $endDate])
                    ->get();

                $totalDays = $vacations->sum(function($vacation) {
                    return Carbon::parse($vacation->start_date)->diffInDays(Carbon::parse($vacation->end_date)) + 1;
                });

                $approvedDays = $vacations->where('status', 'approved')->sum(function($vacation) {
                    return Carbon::parse($vacation->start_date)->diffInDays(Carbon::parse($vacation->end_date)) + 1;
                });

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department->name ?? 'N/A',
                    'total_leave_days' => $totalDays,
                    'approved_days' => $approvedDays,
                    'pending_days' => $totalDays - $approvedDays,
                    'vacation_requests' => $vacations->count(),
                ];
            });

        return [
            'summary' => [
                'total_employees' => $employees->count(),
                'total_leave_days' => $employees->sum('total_leave_days'),
                'total_approved_days' => $employees->sum('approved_days'),
                'total_pending_days' => $employees->sum('pending_days'),
            ],
            'employees' => $employees->values()
        ];
    }

    private function generatePayrollReport($startDate, $endDate)
    {
        $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
        $companyUserIds = DB::table('company_user')
            ->where('company_id', $companyId)
            ->where('status', 'active')
            ->pluck('user_id')
            ->toArray();

        $periodStart = Carbon::parse($startDate)->startOfDay();
        $periodEnd = Carbon::parse($endDate)->endOfDay();
        $workingDays = 0;
        $cursor = $periodStart->copy();
        while ($cursor->lte($periodEnd)) {
            if ($cursor->isWeekday()) {
                $workingDays++;
            }
            $cursor->addDay();
        }
        if ($workingDays <= 0) {
            $workingDays = 1;
        }

        $employees = User::with('department')
            ->whereIn('id', $companyUserIds)
            ->get()
            ->map(function($user) use ($periodStart, $periodEnd, $workingDays) {
                $base = $user->salary ? (float)$user->salary : 0.0;
                $dailyRate = $base / $workingDays;
                $hourlyRate = $dailyRate / 8;
                $records = AttendanceRecord::where('user_id', $user->id)
                    ->whereBetween('date', [$periodStart->format('Y-m-d'), $periodEnd->format('Y-m-d')])
                    ->get();
                $overtimeMinutes = (int)$records->sum('overtime_minutes');
                $lateDays = (int)$records->where('status', 'late')->count();
                $absentDays = (int)$records->where('status', 'absent')->count();
                $bonuses = ($overtimeMinutes / 60.0) * ($hourlyRate * 1.5);
                $deductions = ($absentDays * $dailyRate) + ($lateDays * ($hourlyRate * 0.5));
                $net = $base + $bonuses - $deductions;
                if ($net < 0) {
                    $net = 0;
                }
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department->name ?? 'N/A',
                    'base_salary' => round($base, 2),
                    'bonuses' => round($bonuses, 2),
                    'deductions' => round($deductions, 2),
                    'net_salary' => round($net, 2),
                ];
            });

        return [
            'summary' => [
                'total_employees' => $employees->count(),
                'total_payroll' => round($employees->sum('net_salary'), 2),
            ],
            'employees' => $employees->values()
        ];
    }

    private function generatePerformanceReport($startDate, $endDate)
    {
        $employees = User::with(['vacations', 'events', 'department'])
            ->get()
            ->map(function($user) use ($startDate, $endDate) {
                $eventsCreated = $user->createdEvents()
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count();

                $eventsParticipated = $user->events()
                    ->whereBetween('event_participant.created_at', [$startDate, $endDate])
                    ->count();

                $vacationsApproved = $user->vacations()
                    ->where('status', 'approved')
                    ->whereBetween('start_date', [$startDate, $endDate])
                    ->count();

                $performanceScore = min(100, ($eventsCreated * 10) + ($eventsParticipated * 5) + ($vacationsApproved * 5));

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department->name ?? 'N/A',
                    'events_created' => $eventsCreated,
                    'events_participated' => $eventsParticipated,
                    'vacations_approved' => $vacationsApproved,
                    'performance_score' => $performanceScore,
                ];
            })
            ->sortByDesc('performance_score')
            ->values();

        return [
            'summary' => [
                'total_employees' => $employees->count(),
                'average_performance' => round($employees->avg('performance_score'), 2),
                'top_performers' => $employees->take(5)->pluck('name')->toArray(),
            ],
            'employees' => $employees
        ];
    }
}

