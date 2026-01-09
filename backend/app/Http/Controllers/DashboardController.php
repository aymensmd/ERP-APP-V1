<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Vacation;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function statistics()
    {
        try {
            $totalEmployees = User::count();
            $employeesLastMonth = User::where('created_at', '<', Carbon::now()->subMonth())->count();
            $employeesChange = $employeesLastMonth > 0 
                ? round((($totalEmployees - $employeesLastMonth) / $employeesLastMonth) * 100, 1)
                : 0;

            // Count completed projects (events that have passed)
            $completedEvents = Event::where('end_date', '<', Carbon::now())->count();
            $completedLastMonth = Event::where('end_date', '<', Carbon::now()->subMonth())
                ->where('end_date', '>=', Carbon::now()->subMonths(2))
                ->count();
            $eventsChange = $completedLastMonth > 0 
                ? round((($completedEvents - $completedLastMonth) / $completedLastMonth) * 100, 1)
                : 0;

            // Pending vacation requests
            $pendingTasks = Vacation::where('status', 'pending')->count();
            $pendingLastMonth = Vacation::where('status', 'pending')
                ->where('created_at', '<', Carbon::now()->subMonth())
                ->count();
            $tasksChange = $pendingLastMonth > 0 
                ? round((($pendingTasks - $pendingLastMonth) / $pendingLastMonth) * 100, 1)
                : -5; // Default negative change

            // Mock revenue - replace with actual revenue logic if needed
            $revenue = 24500;
            $revenueChange = 15;

            return response()->json([
                'employees' => [
                    'count' => $totalEmployees,
                    'change' => $employeesChange
                ],
                'projects' => [
                    'count' => $completedEvents,
                    'change' => $eventsChange
                ],
                'tasks' => [
                    'count' => $pendingTasks,
                    'change' => $tasksChange
                ],
                'revenue' => [
                    'amount' => $revenue,
                    'change' => $revenueChange
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch statistics'], 500);
        }
    }

    public function recentActivities()
    {
        try {
            $activities = [];

            // Get recent vacations
            $recentVacations = Vacation::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            foreach ($recentVacations as $vacation) {
                $activities[] = [
                    'id' => 'vacation_' . $vacation->id,
                    'type' => 'vacation',
                    'user' => $vacation->user->name ?? 'Unknown',
                    'action' => 'requested vacation',
                    'time' => $vacation->created_at->diffForHumans(),
                    'status' => $vacation->status === 'approved' ? 'success' : ($vacation->status === 'rejected' ? 'error' : 'processing'),
                    'created_at' => $vacation->created_at->toISOString()
                ];
            }

            // Get recent events
            $recentEvents = Event::with('createdBy')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            foreach ($recentEvents as $event) {
                $activities[] = [
                    'id' => 'event_' . $event->id,
                    'type' => 'event',
                    'user' => $event->createdBy->name ?? 'Unknown',
                    'action' => 'created event: ' . $event->title,
                    'time' => $event->created_at->diffForHumans(),
                    'status' => 'default',
                    'created_at' => $event->created_at->toISOString()
                ];
            }

            // Get recent user updates
            $recentUsers = User::whereNotNull('updated_at')
                ->where('updated_at', '!=', DB::raw('created_at'))
                ->orderBy('updated_at', 'desc')
                ->limit(10)
                ->get();

            foreach ($recentUsers as $user) {
                $activities[] = [
                    'id' => 'user_' . $user->id,
                    'type' => 'user',
                    'user' => $user->name,
                    'action' => 'updated profile',
                    'time' => $user->updated_at->diffForHumans(),
                    'status' => 'default',
                    'created_at' => $user->updated_at->toISOString()
                ];
            }

            // Sort by created_at and limit to 20 most recent
            usort($activities, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json(array_slice($activities, 0, 20));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch activities'], 500);
        }
    }

    public function topPerformers()
    {
        try {
            // Get users with most completed vacations (as a metric for engagement)
            $performers = User::with(['vacations', 'department'])
                ->get()
                ->map(function($user) {
                    $completedVacations = $user->vacations()
                        ->where('status', 'approved')
                        ->where('end_date', '<=', Carbon::now())
                        ->count();
                    
                    $totalVacations = $user->vacations()->count();
                    $progress = $totalVacations > 0 ? round(($completedVacations / $totalVacations) * 100) : 0;
                    
                    // Calculate performance score (combine multiple metrics)
                    $eventsCreated = $user->createdEvents()->count();
                    $performanceScore = min(100, $progress + ($eventsCreated * 5));

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'department' => $user->department ? [
                            'id' => $user->department->id,
                            'name' => $user->department->name
                        ] : null,
                        'progress' => $performanceScore,
                        'avatar' => $user->avatar
                    ];
                })
                ->sortByDesc('progress')
                ->take(10)
                ->values();

            return response()->json($performers);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch top performers'], 500);
        }
    }
}

