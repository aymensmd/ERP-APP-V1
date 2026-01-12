<?php

namespace Tests\Feature\Authorization;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Permission;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthorizeRequestTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        
        // Define test routes using the middleware
        Route::middleware(['web', 'auth', 'authorize:test.permission'])
            ->get('/test-protected-route', function () {
                return 'Access Granted';
            });
            
        Route::middleware(['web', 'auth', 'authorize:test.permission'])
            ->get('/test-scope-check', function () {
                return request()->attributes->get('permission_scope') ?? 'none';
            });
    }

    public function test_request_is_forbidden_without_permission()
    {
        $company = Company::factory()->create();
        $user = User::factory()->create();
        $user->companies()->attach($company->id, ['role_id' => 3, 'status' => 'active']); // Regular employee
        
        // Permission exists but user doesn't have it
        Permission::firstOrCreate(['name' => 'test.permission']);

        $response = $this->actingAs($user)
                         ->withHeaders(['X-Company-ID' => $company->id])
                         ->getJson('/test-protected-route');

        $response->assertStatus(403);
    }

    public function test_request_is_allowed_with_permission()
    {
        $company = Company::factory()->create();
        $user = User::factory()->create();
        $user->companies()->attach($company->id, ['role_id' => 3, 'status' => 'active']);
        
        $permission = Permission::firstOrCreate(['name' => 'test.permission']);
        
        // Grant permission via role (simulated by mocking hasPermissionInCompany or actually assigning)
        // Since we are testing middleware integration with User model, let's assign via pivot if possible
        // or mock the method. For Feature test, better to rely on DB state.
        // Assuming role_permission pivot exists
        
        // Let's create a role with this permission
        $role = \App\Models\Role::create(['name' => 'Test Role', 'slug' => 'test-role', 'company_id' => $company->id]);
        $role->permissions()->attach($permission->id);
        
        $user->companies()->updateExistingPivot($company->id, ['role_id' => $role->id]);

        $response = $this->actingAs($user)
                         ->withHeaders(['X-Company-ID' => $company->id])
                         ->getJson('/test-protected-route');

        $response->assertStatus(200);
        $response->assertSee('Access Granted');
    }
    
    public function test_middleware_resolves_permission_scope()
    {
        $company = Company::factory()->create();
        $user = User::factory()->create();
        $role = \App\Models\Role::create(['name' => 'Test Role', 'slug' => 'test-role', 'company_id' => $company->id]);
        $user->companies()->attach($company->id, ['role_id' => $role->id, 'status' => 'active']);
        
        $permission = Permission::firstOrCreate(['name' => 'test.permission']);
        $role->permissions()->attach($permission->id);
        
        // Default scope should be 'self' if not specified
        $response = $this->actingAs($user)
                         ->withHeaders(['X-Company-ID' => $company->id])
                         ->getJson('/test-scope-check');
                         
        $response->assertSee('self');
    }
}
