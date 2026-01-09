<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class EmployeeSkill extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'user_id',
        'skill_name',
        'category',
        'proficiency',
        'years_of_experience',
        'acquired_date',
        'description',
    ];

    protected $casts = [
        'acquired_date' => 'date',
        'years_of_experience' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}




