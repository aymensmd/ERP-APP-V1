<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Payroll;
use App\Models\AttendanceRecord;
use Carbon\Carbon;

class PayrollTest extends TestCase
{
    use RefreshDatabase;

    protected $company;
    protected $admin;
    protected $employee;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create Roles
        \App\Models\Role::create(['id' => 1, 'name' => 'admin', 'guard_name' => 'web']);
        \App\Models\Role::create(['id' => 2, 'name' => 'employee', 'guard_name' => 'web']);

        // Setup Company and Users
        $this->company = Company::factory()->create();
        
        $this->admin = User::factory()->create();
        $this->admin->companies()->attach($this->company->id, ['role_id' => 1, 'status' => 'active']);
        
        $this->employee = User::factory()->create([
            'salary' => 5000 // Monthly
        ]);
        $this->employee->companies()->attach($this->company->id, ['role_id' => 2, 'status' => 'active']);
        
        $this->actingAs($this->admin);
    }

    public function test_can_generate_payroll()
    {
        // Create some attendance records
        AttendanceRecord::create([
            'company_id' => $this->company->id,
            'user_id' => $this->employee->id,
            'date' => Carbon::now()->subDays(1),
            'clock_in_time' => Carbon::now()->subDays(1)->setHour(9),
            'clock_out_time' => Carbon::now()->subDays(1)->setHour(19), // 10 hours work, 2 hours OT (assuming 8h shift)
            'overtime_minutes' => 120,
            'status' => 'present'
        ]);

        $response = $this->postJson('/api/payroll/generate', [
            'start_date' => Carbon::now()->startOfMonth()->format('Y-m-d'),
            'end_date' => Carbon::now()->endOfMonth()->format('Y-m-d'),
            'user_id' => $this->employee->id
        ], ['X-Company-ID' => $this->company->id]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('payrolls', [
            'user_id' => $this->employee->id,
            'base_salary' => 5000
        ]);
    }
}
