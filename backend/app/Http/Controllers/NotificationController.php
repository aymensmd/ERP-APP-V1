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
            $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
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

            $ids = array_map(function ($n) {
                return $n['id'];
            }, $notifications);
            if ($companyId && count($ids) > 0) {
                $readIds = DB::table('notification_reads')
                    ->where('company_id', $companyId)
                    ->where('user_id', $user->id)
                    ->whereIn('notification_id', $ids)
                    ->pluck('notification_id')
                    ->toArray();
                $notifications = array_map(function ($n) use ($readIds) {
                    $n['read'] = in_array($n['id'], $readIds);
                    return $n;
                }, $notifications);
            }

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
            $user = auth()->user();
            $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
            if (!$companyId) {
                return response()->json(['error' => 'Company context required'], 400);
            }
            DB::table('notification_reads')->updateOrInsert(
                [
                    'company_id' => $companyId,
                    'user_id' => $user->id,
                    'notification_id' => $id,
                ],
                [
                    'read_at' => now(),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark notification as read'], 500);
        }
    }

    public function markAllAsRead(Request $request)
    {
        try {
            $user = auth()->user();
            $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
            if (!$companyId) {
                return response()->json(['error' => 'Company context required'], 400);
            }
            $notifications = $this->index($request)->getData(true);
            $ids = array_map(function ($n) {
                return $n['id'];
            }, $notifications);
            $now = now();
            foreach ($ids as $nid) {
                DB::table('notification_reads')->updateOrInsert(
                    [
                        'company_id' => $companyId,
                        'user_id' => $user->id,
                        'notification_id' => $nid,
                    ],
                    [
                        'read_at' => $now,
                        'updated_at' => $now,
                        'created_at' => $now,
                    ]
                );
            }
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark all notifications as read'], 500);
        }
    }
}

