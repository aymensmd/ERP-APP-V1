<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * Display a listing of the events.
     */
    public function index(Request $request)
    {
        $query = Event::with(['creator', 'participants']);

        // Filter by date range
        if ($request->has('start_date')) {
            $query->where('start_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('end_date', '<=', $request->end_date);
        }

        // Filter by participant
        if ($request->has('user_id')) {
            $query->whereHas('participants', function($q) use ($request) {
                $q->where('users.id', $request->user_id);
            });
        }

        // Order by start date
        $query->orderBy('start_date', 'asc');

        $perPage = $request->get('per_page', 15);
        $events = $query->paginate($perPage);
        return EventResource::collection($events);
    }

    /**
     * Store a newly created event in storage.
     */
    public function store(StoreEventRequest $request)
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;

        // Automatically set company_id from tenant context
        $companyId = $request->attributes->get('current_company_id') ?? session('current_company_id');
        if ($companyId) {
            $validated['company_id'] = $companyId;
        }

        $event = Event::create($validated);

        // Attach participants if provided
        if ($request->has('participants') && is_array($request->participants)) {
            $event->participants()->attach($request->participants);
        }

        $event->load(['creator', 'participants']);
        return new EventResource($event);
    }

    /**
     * Display the specified event.
     */
    public function show(Event $event)
    {
        $event->load(['creator', 'participants']);
        return new EventResource($event);
    }

    /**
     * Update the specified event in storage.
     */
    public function update(UpdateEventRequest $request, Event $event)
    {
        $validated = $request->validated();

        // Only allow creator to update, or admin
        if ($event->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event->update($validated);

        // Update participants if provided
        if ($request->has('participants') && is_array($request->participants)) {
            $event->participants()->sync($request->participants);
        }

        $event->load(['creator', 'participants']);
        return new EventResource($event);
    }

    /**
     * Remove the specified event from storage.
     */
    public function destroy(Request $request, Event $event)
    {
        // Only allow creator or admin to delete
        if ($event->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event->delete();
        return response()->json(['message' => 'Event deleted successfully']);
    }
}

