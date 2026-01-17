<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Company;
use App\Models\Workflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
    }

    protected function attachUserToCompany(User $user, Company $company, int $roleId, array $customPermissions = []): void
    {
        \DB::table('company_user')->insert([
            'company_id' => $company->id,
            'user_id' => $user->id,
            'role_id' => $roleId,
            'department_id' => null,
            'status' => 'active',
            'joined_at' => now(),
            'permissions' => json_encode($customPermissions),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_admin_has_access_to_protected_routes(): void
    {
        $company = Company::create([
            'name' => 'TestCo',
            'slug' => 'testco',
            'domain' => 'testco.local',
            'email' => 'info@testco.local',
            'is_active' => true,
        ]);
        $user = User::factory()->create();
        $this->attachUserToCompany($user, $company, 1);

        $this->actingAs($user)
             ->withHeader('X-Company-ID', (string)$company->id)
             ->get('/api/employees')
             ->assertStatus(200);
    }

    public function test_manager_can_publish_and_run_workflows(): void
    {
        $company = Company::create([
            'name' => 'TestCo',
            'slug' => 'testco',
            'domain' => 'testco.local',
            'email' => 'info@testco.local',
            'is_active' => true,
        ]);
        $user = User::factory()->create();
        $this->attachUserToCompany($user, $company, 2);

        $workflowRes = $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$company->id)
            ->post('/api/workflows', ['name' => 'Test WF'])
            ->assertStatus(201)
            ->json();

        $workflowId = $workflowRes['id'] ?? $workflowRes['data']['id'] ?? null;
        $this->assertNotNull($workflowId);

        $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$company->id)
            ->post("/api/workflows/{$workflowId}/publish")
            ->assertStatus(200);

        $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$company->id)
            ->post("/api/workflows/{$workflowId}/run", ['context' => []])
            ->assertStatus(200);
    }

    public function test_employee_cannot_publish_workflows_but_can_view(): void
    {
        $company = Company::create([
            'name' => 'TestCo',
            'slug' => 'testco',
            'domain' => 'testco.local',
            'email' => 'info@testco.local',
            'is_active' => true,
        ]);
        $user = User::factory()->create();
        $this->attachUserToCompany($user, $company, 3);

        $wf = Workflow::create([
            'company_id' => $company->id,
            'name' => 'Employee WF',
            'status' => 'draft',
            'version' => 1,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$company->id)
            ->get("/api/workflows/{$wf->id}")
            ->assertStatus(200);

        $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$company->id)
            ->post("/api/workflows/{$wf->id}/publish")
            ->assertStatus(403);
    }

    public function test_custom_permission_override_grants_access(): void
    {
        $company = Company::create([
            'name' => 'TestCo',
            'slug' => 'testco',
            'domain' => 'testco.local',
            'email' => 'info@testco.local',
            'is_active' => true,
        ]);
        $user = User::factory()->create();
        $this->attachUserToCompany($user, $company, 3, ['workflows.publish']);

        $wf = Workflow::create([
            'company_id' => $company->id,
            'name' => 'Override WF',
            'status' => 'draft',
            'version' => 1,
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$company->id)
            ->post("/api/workflows/{$wf->id}/publish")
            ->assertStatus(200);
    }

    public function test_missing_company_context_falls_back_to_active_company(): void
    {
        $company = Company::create([
            'name' => 'TestCo',
            'slug' => 'testco',
            'domain' => 'testco.local',
            'email' => 'info@testco.local',
            'is_active' => true,
        ]);
        $user = User::factory()->create();
        $this->attachUserToCompany($user, $company, 2);

        $this->actingAs($user)
            ->get('/api/employees')
            ->assertStatus(200);
    }

    public function test_multi_company_roles_affect_access(): void
    {
        $companyA = Company::create([
            'name' => 'AlphaCo',
            'slug' => 'alphaco',
            'domain' => 'alpha.local',
            'email' => 'info@alpha.local',
            'is_active' => true,
        ]);
        $companyB = Company::create([
            'name' => 'BetaCo',
            'slug' => 'betaco',
            'domain' => 'beta.local',
            'email' => 'info@beta.local',
            'is_active' => true,
        ]);
        $user = User::factory()->create();
        $this->attachUserToCompany($user, $companyA, 3);
        $this->attachUserToCompany($user, $companyB, 2);

        $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$companyA->id)
            ->get('/api/employees')
            ->assertStatus(200);

        $this->actingAs($user)
            ->withHeader('X-Company-ID', (string)$companyB->id)
            ->get('/api/employees')
            ->assertStatus(200);
    }
}
