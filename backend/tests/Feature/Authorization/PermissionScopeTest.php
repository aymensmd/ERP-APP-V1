<?php

namespace Tests\Feature\Authorization;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Permission;
use App\Models\PermissionScope;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PermissionScopeTest extends TestCase
{
    public function test_self_scope_restricts_access_to_own_records()
    {
        $company = Company::factory()->create();
        
        $user = User::factory()->create();
        $user->companies()->attach($company->id, ['role_id' => 2, 'status' => 'active']);
        
        $otherUser = User::factory()->create();
        $otherUser->companies()->attach($company->id, ['role_id' => 2, 'status' => 'active']);

        // Grant 'employees.view' with 'self' scope
        $permission = Permission::firstOrCreate(['name' => 'employees.view'], ['group' => 'employees']);
        
        PermissionScope::create([
            'user_id' => $user->id,
            'company_id' => $company->id,
            'permission_id' => $permission->id,
            'scope' => 'self'
        ]);

        // User should be able to view themselves
        $this->assertTrue($user->canAccess($user, 'employees.view'));
        
        // User should NOT be able to view other user
        $this->assertFalse($user->canAccess($otherUser, 'employees.view'));
    }

    public function test_company_scope_grants_access_to_all()
    {
        $company = Company::factory()->create();
        $user = User::factory()->create();
        $user->companies()->attach($company->id, ['role_id' => 2, 'status' => 'active']);
        $otherUser = User::factory()->create();

        $permission = Permission::firstOrCreate(['name' => 'employees.view'], ['group' => 'employees']);
        
        PermissionScope::create([
            'user_id' => $user->id,
            'company_id' => $company->id,
            'permission_id' => $permission->id,
            'scope' => 'company'
        ]);

        $this->assertTrue($user->canAccess($otherUser, 'employees.view'));
    }
}
