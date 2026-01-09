<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects.
     * Projects are represented as Events in the system.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('events')
                ->leftJoin('users', 'events.created_by', '=', 'users.id')
                ->leftJoin('event_participant', 'events.id', '=', 'event_participant.event_id')
                ->leftJoin('users as participants', 'event_participant.user_id', '=', 'participants.id')
                ->select(
                    'events.id',
                    'events.title as name',
                    'events.description',
                    'events.start_date',
                    'events.end_date as due',
                    'events.location',
                    'events.created_by',
                    'users.name as creator_name',
                    DB::raw('GROUP_CONCAT(DISTINCT participants.name) as team_members'),
                    DB::raw('CASE 
                        WHEN events.end_date < NOW() THEN "Completed"
                        WHEN events.start_date <= NOW() AND events.end_date >= NOW() THEN "In Progress"
                        ELSE "Planned"
                    END as status'),
                    DB::raw('CASE 
                        WHEN events.end_date < NOW() THEN 100
                        WHEN events.start_date <= NOW() AND events.end_date >= NOW() THEN 
                            ROUND((DATEDIFF(NOW(), events.start_date) / DATEDIFF(events.end_date, events.start_date)) * 100)
                        ELSE 0
                    END as progress'),
                    'events.created_at',
                    'events.updated_at'
                )
                ->groupBy('events.id', 'events.title', 'events.description', 'events.start_date', 
                         'events.end_date', 'events.location', 'events.created_by', 'users.name',
                         'events.created_at', 'events.updated_at');

            // Filter by status if provided
            if ($request->has('status')) {
                $status = $request->input('status');
                if ($status === 'completed') {
                    $query->where('events.end_date', '<', Carbon::now());
                } elseif ($status === 'in_progress') {
                    $query->where('events.start_date', '<=', Carbon::now())
                          ->where('events.end_date', '>=', Carbon::now());
                } elseif ($status === 'planned') {
                    $query->where('events.start_date', '>', Carbon::now());
                }
            }

            // Search functionality
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function($q) use ($search) {
                    $q->where('events.title', 'like', "%{$search}%")
                      ->orWhere('events.description', 'like', "%{$search}%");
                });
            }

            $projects = $query->orderBy('events.created_at', 'desc')->get();

            // Format the response
            $formattedProjects = $projects->map(function($project) {
                $teamMembers = $project->team_members ? explode(',', $project->team_members) : [];
                
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description ?: 'No description provided',
                    'status' => $project->status,
                    'team' => array_filter(array_unique($teamMembers)),
                    'progress' => min(100, max(0, (int)$project->progress)),
                    'due' => Carbon::parse($project->due)->format('Y-m-d'),
                    'start_date' => Carbon::parse($project->start_date)->format('Y-m-d'),
                    'location' => $project->location,
                    'created_by' => $project->creator_name,
                    'created_at' => $project->created_at,
                    'updated_at' => $project->updated_at
                ];
            });

            return response()->json($formattedProjects);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch projects: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a newly created project.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'required|date',
                'due' => 'required|date|after:start_date',
                'location' => 'nullable|string|max:255',
                'team' => 'nullable|array',
                'team.*' => 'exists:users,id'
            ]);

            // Automatically set company_id from tenant context
            $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');

            $event = DB::table('events')->insertGetId([
                'title' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['due'],
                'location' => $validated['location'] ?? null,
                'created_by' => auth()->id(),
                'company_id' => $companyId,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Add team members as participants
            if (!empty($validated['team'])) {
                foreach ($validated['team'] as $userId) {
                    DB::table('event_participant')->insert([
                        'event_id' => $event,
                        'user_id' => $userId,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            return response()->json(['message' => 'Project created successfully', 'id' => $event], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create project: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified project.
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'sometimes|required|date',
                'due' => 'sometimes|required|date|after:start_date',
                'location' => 'nullable|string|max:255',
                'team' => 'nullable|array',
                'team.*' => 'exists:users,id'
            ]);

            $updateData = [];
            if (isset($validated['name'])) $updateData['title'] = $validated['name'];
            if (isset($validated['description'])) $updateData['description'] = $validated['description'];
            if (isset($validated['start_date'])) $updateData['start_date'] = $validated['start_date'];
            if (isset($validated['due'])) $updateData['end_date'] = $validated['due'];
            if (isset($validated['location'])) $updateData['location'] = $validated['location'];
            $updateData['updated_at'] = now();

            DB::table('events')->where('id', $id)->update($updateData);

            // Update team members if provided
            if (isset($validated['team'])) {
                DB::table('event_participant')->where('event_id', $id)->delete();
                foreach ($validated['team'] as $userId) {
                    DB::table('event_participant')->insert([
                        'event_id' => $id,
                        'user_id' => $userId,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            return response()->json(['message' => 'Project updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update project: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified project.
     */
    public function destroy($id)
    {
        try {
            DB::table('event_participant')->where('event_id', $id)->delete();
            DB::table('events')->where('id', $id)->delete();

            return response()->json(['message' => 'Project deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete project: ' . $e->getMessage()], 500);
        }
    }
}

