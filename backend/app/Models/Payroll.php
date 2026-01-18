<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasCompany;

class Payroll extends Model
{
    use HasFactory, HasCompany;

    protected $fillable = [
        'company_id',
        'user_id',
        'pay_period_start',
        'pay_period_end',
        'base_salary',
        'overtime_hours',
        'overtime_amount',
        'bonuses',
        'deductions',
        'net_salary',
        'status',
        'payment_date',
    ];

    protected $casts = [
        'pay_period_start' => 'date',
        'pay_period_end' => 'date',
        'payment_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
