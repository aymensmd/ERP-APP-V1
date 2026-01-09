<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;
use App\Traits\Auditable;

class EmployeeCertification extends Model
{
    use HasFactory, HasCompany, Auditable;

    protected $fillable = [
        'company_id',
        'user_id',
        'name',
        'issuing_organization',
        'certificate_number',
        'issue_date',
        'expiry_date',
        'credential_url',
        'file_path',
        'description',
        'does_not_expire',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'does_not_expire' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired()
    {
        return !$this->does_not_expire && 
               $this->expiry_date && 
               $this->expiry_date->isPast();
    }

    public function isExpiringSoon($days = 30)
    {
        return !$this->does_not_expire &&
               $this->expiry_date && 
               $this->expiry_date->isFuture() && 
               $this->expiry_date->diffInDays(now()) <= $days;
    }
}




