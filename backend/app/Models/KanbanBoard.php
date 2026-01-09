<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class KanbanBoard extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'project_id',
        'created_by',
        'settings',
        'is_archived',
    ];

    protected $casts = [
        'settings' => 'array',
        'is_archived' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Event::class, 'project_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks()
    {
        return $this->hasMany(KanbanTask::class, 'board_id');
    }
}




