<?php

namespace App\Http\Controllers;

use App\Models\User;
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
        // This is a placeholder - integrate with actual payroll system
        $employees = User::with('department')->get()->map(function($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department' => $user->department->name ?? 'N/A',
                'base_salary' => 0, // Placeholder - needs payroll integration
                'bonuses' => 0,
                'deductions' => 0,
                'net_salary' => 0,
            ];
        });

        return [
            'summary' => [
                'total_employees' => $employees->count(),
                'total_payroll' => 0,
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

