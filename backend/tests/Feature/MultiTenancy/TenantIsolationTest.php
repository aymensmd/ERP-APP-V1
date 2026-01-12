<?php

namespace Tests\Feature\MultiTenancy;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Department;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TenantIsolationTest extends TestCase
{
    // use RefreshDatabase; // Commented out to avoid wiping existing dev data, unless using a test DB

    public function test_user_cannot_access_other_company_data()
    {
        // Create two companies
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();

        // Create user in Company A
        $userA = User::factory()->create();
        $userA->companies()->attach($companyA->id, ['role_id' => 2, 'status' => 'active']); // Assuming role 2 is employee

        // Create data in both companies
        $deptA = Department::create([
             'name' => 'Dept A', 
             'company_id' => $companyA->id,
             // Add other required fields if any
        ]);
        
        $deptB = Department::create([
            'name' => 'Dept B', 
            'company_id' => $companyB->id
        ]);

        // Authenticate as User A and request Company A context
        $response = $this->actingAs($userA)
                         ->withHeaders(['X-Company-ID' => $companyA->id])
                         ->getJson('/api/departments');

        $response->assertStatus(200);
        
        // Assert we see Company A's data
        $response->assertJsonFragment(['id' => $deptA->id]);
        
        // Assert we DO NOT see Company B's data
        $response->assertJsonMissing(['id' => $deptB->id]);
    }

    public function test_cross_tenant_access_is_forbidden()
    {
        $companyA = Company::factory()->create();
        $companyB = Company::factory()->create();
        
        $userA = User::factory()->create();
        $userA->companies()->attach($companyA->id, ['role_id' => 2, 'status' => 'active']);

        // Try to access Company B with Company A user
        $response = $this->actingAs($userA)
                         ->withHeaders(['X-Company-ID' => $companyB->id])
                         ->getJson('/api/departments');

        // Middleware should block this
        $response->assertStatus(403);
    }
}
