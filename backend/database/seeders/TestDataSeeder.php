<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lead;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Event;
use App\Models\Vacation;
use App\Models\KanbanBoard;
use App\Models\KanbanTask;
use App\Models\User;
use App\Models\Company;
use App\Models\Shift;
use App\Models\Department;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::where('slug', 'default-company')->first() ?? Company::first();
        if (!$company) {
            $this->command->error('No company found. Please run DatabaseSeeder first.');
            return;
        }

        $admin = User::where('email', 'admin@example.com')->first();
        if (!$admin) {
             $this->command->error('Admin user not found.');
             return;
        }

        $employeeRole = Role::where('slug', 'employee')->first();
        $salesDept = Department::where('slug', 'sales')->first() ?? Department::first();

        if (!$employeeRole || !$salesDept) {
            $this->command->error('Required Role (employee) or Department (sales) not found.');
            return;
        }

        // 1. Seed secondary users (Employees)
        $employeeEmails = [];
        for ($i = 1; $i <= 3; $i++) {
            $email = "employee{$i}@example.com";
            $employeeEmails[] = $email;
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => "Employee {$i}",
                    'password' => Hash::make('password'),
                    'role_id' => $employeeRole->id,
                    'department_id' => $salesDept->id,
                    'genre' => $i % 2 == 0 ? 'Female' : 'Male',
                    'date_of_birth' => Carbon::now()->subYears(25 + $i)->toDateString(),
                    'hire_date' => Carbon::now()->subMonths(6),
                    'status' => 'Active', // Some systems use TitleCase
                ]
            );

            // Seed company_user pivot
            DB::table('company_user')->updateOrInsert(
                ['company_id' => $company->id, 'user_id' => $user->id],
                [
                    'role_id' => $employeeRole->id,
                    'department_id' => $salesDept->id,
                    'status' => 'active',
                    'joined_at' => Carbon::now()->subMonths(6),
                    'updated_at' => now(),
                ]
            );
        }

        $employees = User::whereIn('email', $employeeEmails)->get();

        // 2. Seed Leads
        for ($i = 1; $i <= 3; $i++) {
            Lead::updateOrCreate(
                ['email' => "lead{$i}@test.com"],
                [
                    'company_id' => $company->id,
                    'first_name' => "Lead",
                    'last_name' => "Sample {$i}",
                    'phone' => "555-010{$i}",
                    'company_name' => "Tech Corp {$i}",
                    'status' => 'new',
                    'source' => 'website', // Lowercase as per migration
                    'estimated_value' => 5000 * $i,
                    'assigned_to' => $admin->id,
                    'created_by' => $admin->id,
                ]
            );
        }

        // 3. Seed Customers
        for ($i = 1; $i <= 3; $i++) {
            Customer::updateOrCreate(
                ['email' => "customer{$i}@test.com"],
                [
                    'company_id' => $company->id,
                    'first_name' => "Customer",
                    'last_name' => "Plus {$i}",
                    'phone' => "555-020{$i}",
                    'company_name' => "Enterprise {$i} LLC",
                    'type' => 'business', // 'business' instead of 'b2b'
                    'status' => 'active',
                    'billing_address' => "{$i} Broadway St, New York, NY",
                    'created_by' => $admin->id,
                ]
            );
        }

        $customers = Customer::where('company_id', $company->id)->get();

        // 4. Seed Invoices
        foreach ($customers->take(3) as $i => $customer) {
            $invoiceNumber = "INV-2026-00" . ($i + 1);
            $invoice = Invoice::updateOrCreate(
                ['invoice_number' => $invoiceNumber],
                [
                    'company_id' => $company->id,
                    'customer_id' => $customer->id,
                    'issue_date' => Carbon::now()->subDays(10)->toDateString(),
                    'due_date' => Carbon::now()->addDays(20)->toDateString(),
                    'status' => 'draft',
                    'currency' => 'USD',
                    'subtotal' => 1000 * ($i + 1),
                    'tax_amount' => 100 * ($i + 1),
                    'total_amount' => 1100 * ($i + 1),
                    'balance' => 1100 * ($i + 1),
                    'created_by' => $admin->id,
                ]
            );

            // Add an item to each invoice
            InvoiceItem::updateOrCreate(
                ['invoice_id' => $invoice->id, 'description' => 'Consulting Services'],
                [
                    'company_id' => $company->id, // Required by multi-tenancy schema
                    'quantity' => 1,
                    'unit_price' => 1000 * ($i + 1),
                    'line_total' => 1000 * ($i + 1),
                    'tax_rate' => 10,
                    'discount_rate' => 0,
                    'position' => 1,
                ]
            );
        }

        // 5. Seed Events
        for ($i = 1; $i <= 3; $i++) {
            Event::updateOrCreate(
                ['title' => "Strategy Meeting Phase {$i}"],
                [
                    'company_id' => $company->id,
                    'description' => "Discussing Q{$i} targets and workflow optimization.",
                    'start_date' => Carbon::now()->addDays($i * 2)->setHour(10)->setMinute(0)->setSecond(0)->toDateTimeString(),
                    'end_date' => Carbon::now()->addDays($i * 2)->setHour(12)->setMinute(0)->setSecond(0)->toDateTimeString(),
                    'location' => 'Meeting Room A',
                    'created_by' => $admin->id,
                ]
            );
        }

        // 6. Seed Vacations
        foreach ($employees as $i => $employee) {
            Vacation::updateOrCreate(
                ['user_id' => $employee->id, 'start_date' => Carbon::now()->addMonths(1)->toDateString()],
                [
                    'company_id' => $company->id,
                    'type' => 'Annuel', // Uses 'Annuel' as per migration enums
                    'end_date' => Carbon::now()->addMonths(1)->addDays(5)->toDateString(),
                    'reason' => 'Annual family vacation.',
                    'status' => 'Pending', // 'Pending' is the TitleCase value in migration
                ]
            );
        }

        // 7. Seed Kanban Boards and Tasks
        for ($i = 1; $i <= 3; $i++) {
            $board = KanbanBoard::updateOrCreate(
                ['name' => "Project Alpha Board {$i}", 'company_id' => $company->id],
                [
                    'description' => "Main tracking board for project {$i}",
                    'created_by' => $admin->id,
                ]
            );

            for ($j = 1; $j <= 3; $j++) {
                KanbanTask::updateOrCreate(
                    ['board_id' => $board->id, 'title' => "Initial Task {$j}"],
                    [
                        'company_id' => $company->id,
                        'description' => "Description for task {$j} on board {$i}",
                        'status' => 'todo',
                        'priority' => 'medium',
                        'position' => $j,
                        'created_by' => $admin->id,
                    ]
                );
            }
        }

        // 8. Seed Shifts
        for ($i = 1; $i <= 3; $i++) {
            Shift::updateOrCreate(
                ['name' => "Shift Pattern {$i}", 'company_id' => $company->id],
                [
                    'start_time' => '08:00:00',
                    'end_time' => '17:00:00',
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Test data seeded successfully!');
    }
}
