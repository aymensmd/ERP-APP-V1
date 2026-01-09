<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Communication extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'communicable_type',
        'communicable_id',
        'type',
        'subject',
        'content',
        'direction',
        'user_id',
        'scheduled_at',
        'completed_at',
        'status',
        'duration_minutes',
        'attachments',
        'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
        'attachments' => 'array',
        'metadata' => 'array',
        'duration_minutes' => 'integer',
    ];

    public function communicable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}



