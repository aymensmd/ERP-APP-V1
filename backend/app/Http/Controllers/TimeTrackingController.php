<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimeTrackingController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $query = DB::table('time_tracking_sessions')
                ->where('user_id', $user->id)
                ->orderBy('start_time', 'desc');

            if ($request->has('date')) {
                $date = Carbon::parse($request->input('date'));
                $query->whereDate('start_time', $date);
            }

            $sessions = $query->get()->map(function($session) {
                $startTime = Carbon::parse($session->start_time);
                $endTime = $session->end_time ? Carbon::parse($session->end_time) : null;
                $duration = $endTime ? $endTime->diffInSeconds($startTime) : null;

                return [
                    'id' => $session->id,
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                    'duration' => $duration,
                    'duration_formatted' => $duration ? $this->formatDuration($duration) : null,
                    'description' => $session->description,
                    'created_at' => $session->created_at,
                ];
            });

            // Get today's summary
            $today = Carbon::today();
            $todaySessions = DB::table('time_tracking_sessions')
                ->where('user_id', $user->id)
                ->whereDate('start_time', $today)
                ->whereNotNull('end_time')
                ->get();

            $totalSeconds = $todaySessions->sum(function($session) {
                return Carbon::parse($session->end_time)->diffInSeconds(Carbon::parse($session->start_time));
            });

            // Get active session if exists
            $activeSession = DB::table('time_tracking_sessions')
                ->where('user_id', $user->id)
                ->whereNull('end_time')
                ->first();

            return response()->json([
                'sessions' => $sessions,
                'summary' => [
                    'today_total_seconds' => $totalSeconds,
                    'today_total_hours' => round($totalSeconds / 3600, 2),
                    'today_sessions_count' => $todaySessions->count(),
                ],
                'active_session' => $activeSession ? [
                    'id' => $activeSession->id,
                    'start_time' => $activeSession->start_time,
                    'elapsed_seconds' => Carbon::now()->diffInSeconds(Carbon::parse($activeSession->start_time)),
                ] : null
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch time tracking data: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'action' => 'required|in:start,stop',
                'description' => 'nullable|string|max:500',
            ]);

            $user = auth()->user();

            if ($request->input('action') === 'start') {
                // Check if there's an active session
                $activeSession = DB::table('time_tracking_sessions')
                    ->where('user_id', $user->id)
                    ->whereNull('end_time')
                    ->first();

                if ($activeSession) {
                    return response()->json([
                        'error' => 'You already have an active session. Please stop it first.',
                        'active_session_id' => $activeSession->id
                    ], 400);
                }

                $sessionId = DB::table('time_tracking_sessions')->insertGetId([
                    'user_id' => $user->id,
                    'start_time' => Carbon::now(),
                    'description' => $request->input('description'),
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Time tracking started',
                    'session_id' => $sessionId
                ], 201);
            } else {
                // Stop current session
                $activeSession = DB::table('time_tracking_sessions')
                    ->where('user_id', $user->id)
                    ->whereNull('end_time')
                    ->first();

                if (!$activeSession) {
                    return response()->json(['error' => 'No active session found'], 400);
                }

                DB::table('time_tracking_sessions')
                    ->where('id', $activeSession->id)
                    ->update([
                        'end_time' => Carbon::now(),
                        'updated_at' => Carbon::now(),
                    ]);

                $duration = Carbon::now()->diffInSeconds(Carbon::parse($activeSession->start_time));

                return response()->json([
                    'success' => true,
                    'message' => 'Time tracking stopped',
                    'session_id' => $activeSession->id,
                    'duration' => $duration,
                    'duration_formatted' => $this->formatDuration($duration),
                ]);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update time tracking: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = auth()->user();
            
            $deleted = DB::table('time_tracking_sessions')
                ->where('id', $id)
                ->where('user_id', $user->id)
                ->delete();

            if ($deleted) {
                return response()->json(['success' => true, 'message' => 'Session deleted successfully']);
            } else {
                return response()->json(['error' => 'Session not found or unauthorized'], 404);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete session: ' . $e->getMessage()], 500);
        }
    }

    private function formatDuration($seconds)
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;
        return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
    }
}




