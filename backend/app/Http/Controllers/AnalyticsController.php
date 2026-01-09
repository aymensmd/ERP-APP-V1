<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Vacation;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $dateRange = $request->input('range', '30'); // days
            $startDate = Carbon::now()->subDays($dateRange);
            $endDate = Carbon::now();

            return response()->json([
                'employees' => $this->getEmployeeAnalytics($startDate, $endDate),
                'projects' => $this->getProjectAnalytics($startDate, $endDate),
                'vacations' => $this->getVacationAnalytics($startDate, $endDate),
                'events' => $this->getEventAnalytics($startDate, $endDate),
                'performance' => $this->getPerformanceMetrics($startDate, $endDate),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch analytics: ' . $e->getMessage()], 500);
        }
    }

    private function getEmployeeAnalytics($startDate, $endDate)
    {
        $total = User::count();
        $newThisPeriod = User::whereBetween('created_at', [$startDate, $endDate])->count();
        $previousPeriod = User::where('created_at', '<', $startDate)->count();
        $change = $previousPeriod > 0 ? round((($total - $previousPeriod) / $previousPeriod) * 100, 1) : 0;

        return [
            'total' => $total,
            'new_this_period' => $newThisPeriod,
            'change_percentage' => $change,
            'trend' => $change >= 0 ? 'up' : 'down',
        ];
    }

    private function getProjectAnalytics($startDate, $endDate)
    {
        $total = Event::count();
        $completed = Event::where('end_date', '<', Carbon::now())->count();
        $inProgress = Event::where('start_date', '<=', Carbon::now())
            ->where('end_date', '>=', Carbon::now())
            ->count();
        $planned = Event::where('start_date', '>', Carbon::now())->count();

        return [
            'total' => $total,
            'completed' => $completed,
            'in_progress' => $inProgress,
            'planned' => $planned,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
        ];
    }

    private function getVacationAnalytics($startDate, $endDate)
    {
        $total = Vacation::whereBetween('created_at', [$startDate, $endDate])->count();
        $approved = Vacation::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'approved')
            ->count();
        $pending = Vacation::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'pending')
            ->count();
        $rejected = Vacation::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'rejected')
            ->count();

        return [
            'total' => $total,
            'approved' => $approved,
            'pending' => $pending,
            'rejected' => $rejected,
            'approval_rate' => $total > 0 ? round(($approved / $total) * 100, 1) : 0,
        ];
    }

    private function getEventAnalytics($startDate, $endDate)
    {
        $total = Event::whereBetween('created_at', [$startDate, $endDate])->count();
        $upcoming = Event::where('start_date', '>', Carbon::now())
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();
        $completed = Event::where('end_date', '<', Carbon::now())
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        return [
            'total' => $total,
            'upcoming' => $upcoming,
            'completed' => $completed,
        ];
    }

    private function getPerformanceMetrics($startDate, $endDate)
    {
        $employees = User::with(['createdEvents', 'events', 'vacations'])->get();
        
        $avgEventsPerEmployee = $employees->avg(function($user) use ($startDate, $endDate) {
            return $user->createdEvents()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();
        });

        $avgParticipation = $employees->avg(function($user) use ($startDate, $endDate) {
            return $user->events()
                ->whereBetween('event_participant.created_at', [$startDate, $endDate])
                ->count();
        });

        return [
            'average_events_per_employee' => round($avgEventsPerEmployee, 2),
            'average_participation_rate' => round($avgParticipation, 2),
        ];
    }
}




