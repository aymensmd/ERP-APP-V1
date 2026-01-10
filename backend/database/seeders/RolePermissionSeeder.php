<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Get all permissions
        $allPermissions = Permission::all()->pluck('id')->toArray();

        // Admin role gets all permissions
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $adminRole->permissions()->sync($allPermissions);
            $this->command->info('Admin role assigned all permissions');
        }

        // Manager role gets most permissions except admin-only
        $managerRole = Role::where('slug', 'manager')->first();
        if ($managerRole) {
            // Get all permissions except Admin group, plus specific Admin permissions
            $baseManagerPermissions = Permission::where(function($query) {
                    $query->whereNotIn('group', ['Admin'])
                          ->orWhere(function($q) {
                              $q->where('group', 'Admin')
                                ->whereIn('name', ['companies.view', 'users.view', 'audit-logs.view']);
                          });
                })
                ->pluck('id')
                ->toArray();
            
            // Add specific additional permissions for managers (in case they're in Admin group)
            $additionalManagerPermissions = Permission::whereIn('name', [
                'vacations.approve',
                'departments.create',
                'departments.update',
                'departments.delete',
                'employees.create',
                'employees.update',
                'employees.delete',
                'events.delete',
                'reports.generate',
                'reports.export',
            ])->pluck('id')->toArray();
            
            $managerPermissions = array_unique(array_merge($baseManagerPermissions, $additionalManagerPermissions));
            $managerRole->permissions()->sync($managerPermissions);
            $this->command->info('Manager role assigned ' . count($managerPermissions) . ' permissions');
        }

        // Employee role gets basic permissions
        $employeeRole = Role::where('slug', 'employee')->first();
        if ($employeeRole) {
            $employeePermissions = Permission::whereIn('name', [
                'employees.view',
                'vacations.view',
                'vacations.create',
                'vacations.update',
                'events.view',
                'events.create',
                'events.update',
                'projects.view',
                'kanban.view',
                'dashboard.view',
                'time-tracking.view',
                'time-tracking.manage',
                'analytics.view',
                'reports.view',
                'org-chart.view',
                'onboarding.view', // Can view their own onboarding
            ])->pluck('id')->toArray();
            
            $employeeRole->permissions()->sync($employeePermissions);
            $this->command->info('Employee role assigned ' . count($employeePermissions) . ' permissions');
        }

        $this->command->info('Role permissions seeded successfully!');
    }
}
