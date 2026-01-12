<?php

namespace Tests\Feature\Hierarchy;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Department;
use App\Models\Permission;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class HierarchyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Permission::firstOrCreate(['name' => 'org-chart.view']); // Ensure permission exists
    }

    public function test_can_fetch_organization_tree()
    {
        $company = Company::factory()->create();
        $admin = User::factory()->create();
        $admin->companies()->attach($company->id, ['role_id' => 1, 'status' => 'active']);
        
        // Create nested departments
        $engineering = Department::create([
            'name' => 'Engineering',
            'company_id' => $company->id,
            'manager_id' => $admin->id
        ]);
        
        $backend = Department::create([
            'name' => 'Backend',
            'company_id' => $company->id,
            'parent_id' => $engineering->id
        ]);
        
        // Assign users
        $dev = User::factory()->create();
        $dev->companies()->attach($company->id, ['role_id' => 3, 'status' => 'active']);
        $dev->department_id = $backend->id;
        $dev->save();
        
        // Mock permission check through middleware or just act as admin
        $response = $this->actingAs($admin)
                         ->withHeaders(['X-Company-ID' => $company->id])
                         ->getJson('/api/organizational-chart');
                         
        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => [
                'id', 'name', 'type', 'children' => [
                    '*' => [
                         'id', 'name', 'type', 'children'
                    ]
                ]
            ]
        ]);
    }
    
    public function test_approval_chain_resolution()
    {
        $company = Company::factory()->create();
        
        // CEO -> VP -> Manager -> Employee
        $ceo = User::factory()->create();
        $vp = User::factory()->create(['manager_id' => $ceo->id]);
        $manager = User::factory()->create(['manager_id' => $vp->id]);
        $employee = User::factory()->create(['manager_id' => $manager->id]);
        
        $service = new \App\Services\ApprovalChainService();
        
        // Vacation request (goes to direct manager)
        $approver = $service->getNextApprover($employee, 'vacation');
        $this->assertEquals($manager->id, $approver->id);
        
        // If manager requests, goes to VP
        $approver = $service->getNextApprover($manager, 'vacation');
        $this->assertEquals($vp->id, $approver->id);
    }
    
    public function test_department_budget_approval()
    {
        $company = Company::factory()->create();
        $deptHead = User::factory()->create();
        
        $dept = Department::create([
            'name' => 'Sales',
            'company_id' => $company->id,
            'manager_id' => $deptHead->id
        ]);
        
        $employee = User::factory()->create(['department_id' => $dept->id, 'manager_id' => null]);
        
        $service = new \App\Services\ApprovalChainService();
        
        // Budget request (goes to department head)
        $approver = $service->getNextApprover($employee, 'budget');
        $this->assertEquals($deptHead->id, $approver->id);
    }
}
