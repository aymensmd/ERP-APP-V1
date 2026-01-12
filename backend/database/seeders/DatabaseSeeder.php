<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default company
        $company = Company::firstOrCreate(
            ['slug' => 'default-company'],
            [
                'name' => 'Default Company',
                'email' => 'admin@company.com',
                'timezone' => 'UTC',
                'currency' => 'USD',
                'language' => 'en',
                'subscription_status' => 'active',
                'is_active' => true,
            ]
        );

        // Create default roles (don't set IDs, let them auto-increment if needed)
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin', 'company_id' => $company->id],
            ['name' => 'Admin']
        );
        
        $managerRole = Role::firstOrCreate(
            ['slug' => 'manager', 'company_id' => $company->id],
            ['name' => 'Manager']
        );
        
        $employeeRole = Role::firstOrCreate(
            ['slug' => 'employee', 'company_id' => $company->id],
            ['name' => 'Employee']
        );

        // Update existing departments to have company_id, or create new ones if they don't exist
        $departments = [
            ['name' => 'VoIP', 'slug' => 'voip'],
            ['name' => 'Sales', 'slug' => 'sales'],
            ['name' => 'Contact', 'slug' => 'contact'],
            ['name' => 'Helpdesk', 'slug' => 'helpdesk'],
            ['name' => 'Dashboard', 'slug' => 'dashboard'],
            ['name' => 'Telecom', 'slug' => 'telecom'],
        ];

        foreach ($departments as $dept) {
            // Find by slug only (since slug is unique)
            $existingDept = Department::where('slug', $dept['slug'])->first();
            
            if ($existingDept) {
                // Update existing department with company_id if it doesn't have one
                if (!$existingDept->company_id) {
                    $existingDept->company_id = $company->id;
                    $existingDept->save();
                }
            } else {
                // Create new department with company_id only if it doesn't exist
                Department::create([
                    'name' => $dept['name'],
                    'slug' => $dept['slug'],
                    'company_id' => $company->id,
                ]);
            }
        }

        // Create admin user
        $adminDepartment = Department::where('slug', 'dashboard')->where('company_id', $company->id)->first();

        if ($adminRole && $adminDepartment) {
            $adminUser = User::firstOrCreate(
                ['email' => 'admin@example.com'],
                [
                    'name' => 'Admin User',
                    'email' => 'admin@example.com',
                    'password' => Hash::make('password'), // Default password: password
                    'role_id' => $adminRole->id,
                    'department_id' => $adminDepartment->id,
                    'date_of_birth' => '1990-01-01',
                    'genre' => 'Male',
                    'address' => '123 Admin Street',
                    'phone_number' => '123456789',
                    'sos_number' => '987654321',
                    'social_situation' => 'Single',
                    'is_platform_admin' => true,
                ]
            );

            // Ensure is_platform_admin is set even if user existed
            if (!$adminUser->is_platform_admin) {
                $adminUser->update(['is_platform_admin' => true]);
            }

            // Link admin user to company (use updateOrInsert to avoid duplicates)
            DB::table('company_user')->updateOrInsert(
                [
                    'company_id' => $company->id,
                    'user_id' => $adminUser->id,
                ],
                [
                    'role_id' => $adminRole->id,
                    'department_id' => $adminDepartment->id,
                    'status' => 'active',
                    'joined_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Seed permissions and role permissions
        $this->call([
            PermissionSeeder::class,
            RolePermissionSeeder::class,
        ]);
    }
}
