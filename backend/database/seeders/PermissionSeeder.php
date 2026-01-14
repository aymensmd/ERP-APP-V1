<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        $permissions = [
            // HRM - Employee Management
            ['name' => 'employees.view', 'resource' => 'employees', 'action' => 'view', 'description' => 'View employees', 'group' => 'HRM', 'sort_order' => 1],
            ['name' => 'employees.create', 'resource' => 'employees', 'action' => 'create', 'description' => 'Create employees', 'group' => 'HRM', 'sort_order' => 2],
            ['name' => 'employees.update', 'resource' => 'employees', 'action' => 'update', 'description' => 'Update employees', 'group' => 'HRM', 'sort_order' => 3],
            ['name' => 'employees.delete', 'resource' => 'employees', 'action' => 'delete', 'description' => 'Delete employees', 'group' => 'HRM', 'sort_order' => 4],

            // HRM - Department Management
            ['name' => 'departments.view', 'resource' => 'departments', 'action' => 'view', 'description' => 'View departments', 'group' => 'HRM', 'sort_order' => 10],
            ['name' => 'departments.create', 'resource' => 'departments', 'action' => 'create', 'description' => 'Create departments', 'group' => 'HRM', 'sort_order' => 11],
            ['name' => 'departments.update', 'resource' => 'departments', 'action' => 'update', 'description' => 'Update departments', 'group' => 'HRM', 'sort_order' => 12],
            ['name' => 'departments.delete', 'resource' => 'departments', 'action' => 'delete', 'description' => 'Delete departments', 'group' => 'HRM', 'sort_order' => 13],

            // HRM - Vacation Management
            ['name' => 'vacations.view', 'resource' => 'vacations', 'action' => 'view', 'description' => 'View vacations', 'group' => 'HRM', 'sort_order' => 20],
            ['name' => 'vacations.create', 'resource' => 'vacations', 'action' => 'create', 'description' => 'Create vacation requests', 'group' => 'HRM', 'sort_order' => 21],
            ['name' => 'vacations.update', 'resource' => 'vacations', 'action' => 'update', 'description' => 'Update vacations', 'group' => 'HRM', 'sort_order' => 22],
            ['name' => 'vacations.delete', 'resource' => 'vacations', 'action' => 'delete', 'description' => 'Delete vacations', 'group' => 'HRM', 'sort_order' => 23],
            ['name' => 'vacations.approve', 'resource' => 'vacations', 'action' => 'approve', 'description' => 'Approve/reject vacations', 'group' => 'HRM', 'sort_order' => 24],

            // HRM - Events Management
            ['name' => 'events.view', 'resource' => 'events', 'action' => 'view', 'description' => 'View events', 'group' => 'HRM', 'sort_order' => 30],
            ['name' => 'events.create', 'resource' => 'events', 'action' => 'create', 'description' => 'Create events', 'group' => 'HRM', 'sort_order' => 31],
            ['name' => 'events.update', 'resource' => 'events', 'action' => 'update', 'description' => 'Update events', 'group' => 'HRM', 'sort_order' => 32],
            ['name' => 'events.delete', 'resource' => 'events', 'action' => 'delete', 'description' => 'Delete events', 'group' => 'HRM', 'sort_order' => 33],

            // Projects Management
            ['name' => 'projects.view', 'resource' => 'projects', 'action' => 'view', 'description' => 'View projects', 'group' => 'Projects', 'sort_order' => 40],
            ['name' => 'projects.create', 'resource' => 'projects', 'action' => 'create', 'description' => 'Create projects', 'group' => 'Projects', 'sort_order' => 41],
            ['name' => 'projects.update', 'resource' => 'projects', 'action' => 'update', 'description' => 'Update projects', 'group' => 'Projects', 'sort_order' => 42],
            ['name' => 'projects.delete', 'resource' => 'projects', 'action' => 'delete', 'description' => 'Delete projects', 'group' => 'Projects', 'sort_order' => 43],

            // Reports
            ['name' => 'reports.view', 'resource' => 'reports', 'action' => 'view', 'description' => 'View reports', 'group' => 'Reports', 'sort_order' => 50],
            ['name' => 'reports.generate', 'resource' => 'reports', 'action' => 'generate', 'description' => 'Generate reports', 'group' => 'Reports', 'sort_order' => 51],
            ['name' => 'reports.export', 'resource' => 'reports', 'action' => 'export', 'description' => 'Export reports', 'group' => 'Reports', 'sort_order' => 52],

            // Analytics
            ['name' => 'analytics.view', 'resource' => 'analytics', 'action' => 'view', 'description' => 'View analytics', 'group' => 'Analytics', 'sort_order' => 60],

            // Dashboard
            ['name' => 'dashboard.view', 'resource' => 'dashboard', 'action' => 'view', 'description' => 'View dashboard', 'group' => 'Dashboard', 'sort_order' => 70],

            // Time Tracking
            ['name' => 'time-tracking.view', 'resource' => 'time-tracking', 'action' => 'view', 'description' => 'View time tracking', 'group' => 'HRM', 'sort_order' => 80],
            ['name' => 'time-tracking.manage', 'resource' => 'time-tracking', 'action' => 'manage', 'description' => 'Manage time tracking', 'group' => 'HRM', 'sort_order' => 81],

            // Attendance
            ['name' => 'attendance.view', 'resource' => 'attendance', 'action' => 'view', 'description' => 'View attendance records', 'group' => 'HRM', 'sort_order' => 85],
            ['name' => 'attendance.manage', 'resource' => 'attendance', 'action' => 'manage', 'description' => 'Manage attendance records', 'group' => 'HRM', 'sort_order' => 86],
            ['name' => 'attendance.approve', 'resource' => 'attendance', 'action' => 'approve', 'description' => 'Approve attendance records', 'group' => 'HRM', 'sort_order' => 87],

            // Company Management (Admin only)
            ['name' => 'companies.view', 'resource' => 'companies', 'action' => 'view', 'description' => 'View companies', 'group' => 'Admin', 'sort_order' => 100],
            ['name' => 'companies.create', 'resource' => 'companies', 'action' => 'create', 'description' => 'Create companies', 'group' => 'Admin', 'sort_order' => 101],
            ['name' => 'companies.update', 'resource' => 'companies', 'action' => 'update', 'description' => 'Update companies', 'group' => 'Admin', 'sort_order' => 102],
            ['name' => 'companies.delete', 'resource' => 'companies', 'action' => 'delete', 'description' => 'Delete companies', 'group' => 'Admin', 'sort_order' => 103],

            // User & Role Management (Admin only)
            ['name' => 'users.view', 'resource' => 'users', 'action' => 'view', 'description' => 'View users', 'group' => 'Admin', 'sort_order' => 110],
            ['name' => 'users.create', 'resource' => 'users', 'action' => 'create', 'description' => 'Create users', 'group' => 'Admin', 'sort_order' => 111],
            ['name' => 'users.update', 'resource' => 'users', 'action' => 'update', 'description' => 'Update users', 'group' => 'Admin', 'sort_order' => 112],
            ['name' => 'users.delete', 'resource' => 'users', 'action' => 'delete', 'description' => 'Delete users', 'group' => 'Admin', 'sort_order' => 113],

            ['name' => 'roles.view', 'resource' => 'roles', 'action' => 'view', 'description' => 'View roles', 'group' => 'Admin', 'sort_order' => 120],
            ['name' => 'roles.create', 'resource' => 'roles', 'action' => 'create', 'description' => 'Create roles', 'group' => 'Admin', 'sort_order' => 121],
            ['name' => 'roles.update', 'resource' => 'roles', 'action' => 'update', 'description' => 'Update roles', 'group' => 'Admin', 'sort_order' => 122],
            ['name' => 'roles.delete', 'resource' => 'roles', 'action' => 'delete', 'description' => 'Delete roles', 'group' => 'Admin', 'sort_order' => 123],

            ['name' => 'permissions.view', 'resource' => 'permissions', 'action' => 'view', 'description' => 'View permissions', 'group' => 'Admin', 'sort_order' => 130],
            ['name' => 'permissions.manage', 'resource' => 'permissions', 'action' => 'manage', 'description' => 'Manage permissions', 'group' => 'Admin', 'sort_order' => 131],

            // Audit Logs (Admin only)
            ['name' => 'audit-logs.view', 'resource' => 'audit-logs', 'action' => 'view', 'description' => 'View audit logs', 'group' => 'Admin', 'sort_order' => 140],
            ['name' => 'audit-logs.export', 'resource' => 'audit-logs', 'action' => 'export', 'description' => 'Export audit logs', 'group' => 'Admin', 'sort_order' => 141],

            // Settings
            ['name' => 'settings.view', 'resource' => 'settings', 'action' => 'view', 'description' => 'View settings', 'group' => 'Admin', 'sort_order' => 150],
            ['name' => 'settings.update', 'resource' => 'settings', 'action' => 'update', 'description' => 'Update settings', 'group' => 'Admin', 'sort_order' => 151],

            // CRM - Leads Management
            ['name' => 'leads.view', 'resource' => 'leads', 'action' => 'view', 'description' => 'View leads', 'group' => 'CRM', 'sort_order' => 160],
            ['name' => 'leads.create', 'resource' => 'leads', 'action' => 'create', 'description' => 'Create leads', 'group' => 'CRM', 'sort_order' => 161],
            ['name' => 'leads.update', 'resource' => 'leads', 'action' => 'update', 'description' => 'Update leads', 'group' => 'CRM', 'sort_order' => 162],
            ['name' => 'leads.delete', 'resource' => 'leads', 'action' => 'delete', 'description' => 'Delete leads', 'group' => 'CRM', 'sort_order' => 163],
            ['name' => 'leads.convert', 'resource' => 'leads', 'action' => 'convert', 'description' => 'Convert leads to customers', 'group' => 'CRM', 'sort_order' => 164],

            // CRM - Customers Management
            ['name' => 'customers.view', 'resource' => 'customers', 'action' => 'view', 'description' => 'View customers', 'group' => 'CRM', 'sort_order' => 170],
            ['name' => 'customers.create', 'resource' => 'customers', 'action' => 'create', 'description' => 'Create customers', 'group' => 'CRM', 'sort_order' => 171],
            ['name' => 'customers.update', 'resource' => 'customers', 'action' => 'update', 'description' => 'Update customers', 'group' => 'CRM', 'sort_order' => 172],
            ['name' => 'customers.delete', 'resource' => 'customers', 'action' => 'delete', 'description' => 'Delete customers', 'group' => 'CRM', 'sort_order' => 173],

            // CRM - Invoices Management
            ['name' => 'invoices.view', 'resource' => 'invoices', 'action' => 'view', 'description' => 'View invoices', 'group' => 'CRM', 'sort_order' => 180],
            ['name' => 'invoices.create', 'resource' => 'invoices', 'action' => 'create', 'description' => 'Create invoices', 'group' => 'CRM', 'sort_order' => 181],
            ['name' => 'invoices.update', 'resource' => 'invoices', 'action' => 'update', 'description' => 'Update invoices', 'group' => 'CRM', 'sort_order' => 182],
            ['name' => 'invoices.delete', 'resource' => 'invoices', 'action' => 'delete', 'description' => 'Delete invoices', 'group' => 'CRM', 'sort_order' => 183],
            ['name' => 'invoices.send', 'resource' => 'invoices', 'action' => 'send', 'description' => 'Send invoices', 'group' => 'CRM', 'sort_order' => 184],

            // Kanban Boards & Tasks
            ['name' => 'kanban.view', 'resource' => 'kanban', 'action' => 'view', 'description' => 'View kanban boards', 'group' => 'Projects', 'sort_order' => 190],
            ['name' => 'kanban.create', 'resource' => 'kanban', 'action' => 'create', 'description' => 'Create kanban boards', 'group' => 'Projects', 'sort_order' => 191],
            ['name' => 'kanban.update', 'resource' => 'kanban', 'action' => 'update', 'description' => 'Update kanban boards', 'group' => 'Projects', 'sort_order' => 192],
            ['name' => 'kanban.delete', 'resource' => 'kanban', 'action' => 'delete', 'description' => 'Delete kanban boards', 'group' => 'Projects', 'sort_order' => 193],

            // Employee Onboarding
            ['name' => 'onboarding.view', 'resource' => 'onboarding', 'action' => 'view', 'description' => 'View onboarding checklists', 'group' => 'HRM', 'sort_order' => 200],
            ['name' => 'onboarding.create', 'resource' => 'onboarding', 'action' => 'create', 'description' => 'Create onboarding checklists', 'group' => 'HRM', 'sort_order' => 201],
            ['name' => 'onboarding.update', 'resource' => 'onboarding', 'action' => 'update', 'description' => 'Update onboarding checklists', 'group' => 'HRM', 'sort_order' => 202],
            ['name' => 'onboarding.delete', 'resource' => 'onboarding', 'action' => 'delete', 'description' => 'Delete onboarding checklists', 'group' => 'HRM', 'sort_order' => 203],

            // Shift Management
            ['name' => 'shifts.view', 'resource' => 'shifts', 'action' => 'view', 'description' => 'View shifts', 'group' => 'HRM', 'sort_order' => 210],
            ['name' => 'shifts.create', 'resource' => 'shifts', 'action' => 'create', 'description' => 'Create shifts', 'group' => 'HRM', 'sort_order' => 211],
            ['name' => 'shifts.update', 'resource' => 'shifts', 'action' => 'update', 'description' => 'Update shifts', 'group' => 'HRM', 'sort_order' => 212],
            ['name' => 'shifts.delete', 'resource' => 'shifts', 'action' => 'delete', 'description' => 'Delete shifts', 'group' => 'HRM', 'sort_order' => 213],

            // Organizational Chart
            ['name' => 'org-chart.view', 'resource' => 'org-chart', 'action' => 'view', 'description' => 'View organizational chart', 'group' => 'HRM', 'sort_order' => 220],
            ['name' => 'org-chart.export', 'resource' => 'org-chart', 'action' => 'export', 'description' => 'Export organizational chart', 'group' => 'HRM', 'sort_order' => 221],
            
            // Workflow / Automation
            ['name' => 'workflows.view', 'resource' => 'workflows', 'action' => 'view', 'description' => 'View workflows', 'group' => 'Workflow', 'sort_order' => 300],
            ['name' => 'workflows.create', 'resource' => 'workflows', 'action' => 'create', 'description' => 'Create workflows', 'group' => 'Workflow', 'sort_order' => 301],
            ['name' => 'workflows.update', 'resource' => 'workflows', 'action' => 'update', 'description' => 'Update workflows', 'group' => 'Workflow', 'sort_order' => 302],
            ['name' => 'workflows.delete', 'resource' => 'workflows', 'action' => 'delete', 'description' => 'Delete workflows', 'group' => 'Workflow', 'sort_order' => 303],
            ['name' => 'workflows.run', 'resource' => 'workflows', 'action' => 'run', 'description' => 'Run workflows', 'group' => 'Workflow', 'sort_order' => 304],
            ['name' => 'workflows.publish', 'resource' => 'workflows', 'action' => 'publish', 'description' => 'Publish workflows', 'group' => 'Workflow', 'sort_order' => 305],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        $this->command->info('Permissions seeded successfully!');
    }
}




