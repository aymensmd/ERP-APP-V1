<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Event;
use App\Models\Vacation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $notifications = [];

            // Get upcoming events (within next 7 days)
            $eventIds = DB::table('event_participant')
                ->where('user_id', $user->id)
                ->pluck('event_id')
                ->toArray();

            $upcomingEvents = Event::whereIn('id', $eventIds)
                ->orWhere('created_by', $user->id)
                ->where('start_date', '>=', Carbon::now())
                ->where('start_date', '<=', Carbon::now()->addDays(7))
                ->with(['createdBy', 'participants'])
                ->get()
                ->map(function($event) {
                return [
                    'id' => 'event_' . $event->id,
                    'type' => 'event',
                    'title' => $event->title,
                    'description' => $event->description,
                    'date' => $event->start_date->toISOString(),
                    'status' => 'info',
                    'read' => false,
                    'created_at' => $event->created_at->toISOString(),
                ];
            });

            $notifications = array_merge($notifications, $upcomingEvents->toArray());

            // Get vacation status updates
            $vacationUpdates = Vacation::where('user_id', $user->id)
                ->where('updated_at', '>=', Carbon::now()->subDays(7))
                ->whereIn('status', ['approved', 'rejected'])
                ->with('user')
                ->get()
                ->map(function($vacation) {
                    return [
                        'id' => 'vacation_' . $vacation->id,
                        'type' => 'vacation',
                        'title' => 'Vacation Request ' . ucfirst($vacation->status),
                        'description' => "Your vacation request from {$vacation->start_date->format('M d')} to {$vacation->end_date->format('M d')} has been {$vacation->status}",
                        'date' => $vacation->updated_at->toISOString(),
                        'status' => $vacation->status === 'approved' ? 'success' : 'error',
                        'read' => false,
                        'created_at' => $vacation->updated_at->toISOString(),
                    ];
                });

            $notifications = array_merge($notifications, $vacationUpdates->toArray());

            // Sort by date (most recent first)
            usort($notifications, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json($notifications);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch notifications: ' . $e->getMessage()], 500);
        }
    }

    public function markAsRead(Request $request, $id)
    {
        try {
            // In a real application, you'd store read status in a database
            // For now, we'll just return success
            return response()->json(['success' => true, 'message' => 'Notification marked as read']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark notification as read'], 500);
        }
    }

    public function markAllAsRead(Request $request)
    {
        try {
            // In a real application, you'd update all notifications in the database
            return response()->json(['success' => true, 'message' => 'All notifications marked as read']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark all notifications as read'], 500);
        }
    }
}

