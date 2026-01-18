<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;

class CompanySetting extends Model
{
    use HasFactory, HasCompany;

    protected $fillable = [
        'company_id',
        'key',
        'value',
        'type', // string, integer, boolean, json
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
