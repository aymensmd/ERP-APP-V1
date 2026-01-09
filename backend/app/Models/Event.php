<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Event extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'location',
        'created_by',
        'company_id',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    /**
     * Get the user that created the event.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user that created the event (alias for creator).
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the participants for the event.
     */
    public function participants()
    {
        return $this->belongsToMany(User::class, 'event_participant', 'event_id', 'user_id')
                    ->withTimestamps();
    }
}


