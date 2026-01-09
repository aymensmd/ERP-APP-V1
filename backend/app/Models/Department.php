<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class Department extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'company_id',
    ];

    /**
     * Get the users for the department.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}


