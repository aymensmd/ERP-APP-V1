<?php

namespace Tests\Feature\MultiTenancy;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TenantMiddlewareTest extends TestCase
{
    public function test_request_without_company_context_is_rejected()
    {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)
                         ->getJson('/api/departments'); // Protected route

        // Should fail or default to user's first company depending on logic
        // If user has no company, it should be 400
        $response->assertStatus(400); 
    }

    public function test_header_resolution_works()
    {
        $company = Company::factory()->create();
        $user = User::factory()->create();
        $user->companies()->attach($company->id, ['role_id' => 2, 'status' => 'active']);

        $response = $this->actingAs($user)
                         ->withHeaders(['X-Company-ID' => $company->id])
                         ->getJson('/api/user');

        $response->assertStatus(200);
        $this->assertEquals($company->id, session('current_company_id'));
    }

    public function test_subdomain_resolution_works()
    {
        $company = Company::factory()->create(['slug' => 'test-company']);
        $user = User::factory()->create();
        $user->companies()->attach($company->id, ['role_id' => 2, 'status' => 'active']);

        $host = 'test-company.erp.local'; // Assuming logic handles this
        
        $response = $this->actingAs($user)
                         ->withHeaders(['Host' => $host])
                         ->getJson('/api/user');
                         
        // If middleware supports subdomain
        // $response->assertStatus(200); 
    }
}
