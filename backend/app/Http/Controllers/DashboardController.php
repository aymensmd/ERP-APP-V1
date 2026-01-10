<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Vacation;
use App\Models\Event;
use App\Models\Lead;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\KanbanTask;
use App\Models\KanbanBoard;
use App\Models\Company;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function statistics()
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }
            
            // HRM Statistics - Filter users by company via pivot table
            $companyUserIds = DB::table('company_user')
                ->where('company_id', $companyId)
                ->where('status', 'active')
                ->pluck('user_id')
                ->toArray();
            
            $totalEmployees = count($companyUserIds);
            $employeesLastMonth = DB::table('company_user')
                ->where('company_id', $companyId)
                ->where('status', 'active')
                ->where('joined_at', '<', Carbon::now()->subMonth())
                ->count();
            $employeesChange = $employeesLastMonth > 0 
                ? round((($totalEmployees - $employeesLastMonth) / $employeesLastMonth) * 100, 1)
                : 0;

            // Vacations are automatically scoped by HasCompany trait
            $pendingVacations = Vacation::where('status', 'pending')->count();
            $activeVacations = Vacation::where('status', 'approved')
                ->where('start_date', '<=', Carbon::now())
                ->where('end_date', '>=', Carbon::now())
                ->count();

            // Projects Statistics - Automatically scoped by HasCompany trait
            $totalProjects = Event::count();
            $completedProjects = Event::where('end_date', '<', Carbon::now())->count();
            $activeProjects = Event::where('start_date', '<=', Carbon::now())
                ->where('end_date', '>=', Carbon::now())
                ->count();
            
            $projectsLastMonth = Event::where('created_at', '<', Carbon::now()->subMonth())->count();
            $projectsChange = $projectsLastMonth > 0 
                ? round((($totalProjects - $projectsLastMonth) / $projectsLastMonth) * 100, 1)
                : 0;

            // Tasks/Kanban Statistics - Automatically scoped by HasCompany trait
            $totalTasks = KanbanTask::count();
            $pendingTasks = KanbanTask::where('status', '!=', 'done')->count();
            $overdueTasks = KanbanTask::where('due_date', '<', Carbon::now())
                ->where('status', '!=', 'done')
                ->count();
            
            $tasksLastMonth = KanbanTask::where('created_at', '<', Carbon::now()->subMonth())->count();
            $tasksChange = $tasksLastMonth > 0 
                ? round((($totalTasks - $tasksLastMonth) / $tasksLastMonth) * 100, 1)
                : 0;

            // CRM Statistics - Automatically scoped by HasCompany trait
            $totalLeads = Lead::count();
            $newLeads = Lead::where('status', 'new')
                ->where('created_at', '>=', Carbon::now()->subMonth())
                ->count();
            
            $totalCustomers = Customer::count();
            $recentCustomers = Customer::where('created_at', '>=', Carbon::now()->subMonth())
                ->count();

            // Finance Statistics - Automatically scoped by HasCompany trait
            $totalRevenue = Invoice::where('status', 'paid')
                ->sum('total_amount');
            
            $pendingInvoices = Invoice::where('status', '!=', 'paid')
                ->count();
            
            $overdueInvoices = Invoice::where('due_date', '<', Carbon::now())
                ->where('status', '!=', 'paid')
                ->count();
            
            $monthlyRevenue = Invoice::where('status', 'paid')
                ->where('paid_at', '>=', Carbon::now()->startOfMonth())
                ->sum('total_amount');
            
            $lastMonthRevenue = Invoice::where('status', 'paid')
                ->whereBetween('paid_at', [
                    Carbon::now()->subMonth()->startOfMonth(),
                    Carbon::now()->subMonth()->endOfMonth()
                ])
                ->sum('total_amount');
            
            $revenueChange = $lastMonthRevenue > 0 
                ? round((($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
                : ($monthlyRevenue > 0 ? 100 : 0);

            return response()->json([
                'hrm' => [
                    'employees' => [
                        'total' => $totalEmployees,
                        'change' => $employeesChange
                    ],
                    'vacations' => [
                        'pending' => $pendingVacations,
                        'active' => $activeVacations
                    ]
                ],
                'projects' => [
                    'total' => $totalProjects,
                    'active' => $activeProjects,
                    'completed' => $completedProjects,
                    'change' => $projectsChange
                ],
                'tasks' => [
                    'total' => $totalTasks,
                    'pending' => $pendingTasks,
                    'overdue' => $overdueTasks,
                    'change' => $tasksChange
                ],
                'crm' => [
                    'leads' => [
                        'total' => $totalLeads,
                        'new_this_month' => $newLeads
                    ],
                    'customers' => [
                        'total' => $totalCustomers,
                        'new_this_month' => $recentCustomers
                    ]
                ],
                'finance' => [
                    'revenue' => [
                        'total' => round($totalRevenue, 2),
                        'this_month' => round($monthlyRevenue, 2),
                        'change' => $revenueChange
                    ],
                    'invoices' => [
                        'pending' => $pendingInvoices,
                        'overdue' => $overdueInvoices
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch statistics: ' . $e->getMessage()], 500);
        }
    }

    public function recentActivities()
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }
            
            $activities = [];

            // Get recent vacations - Automatically scoped by HasCompany trait
            $recentVacations = Vacation::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            foreach ($recentVacations as $vacation) {
                $activities[] = [
                    'id' => 'vacation_' . $vacation->id,
                    'type' => 'vacation',
                    'module' => 'HRM',
                    'user' => $vacation->user->name ?? 'Unknown',
                    'action' => 'requested vacation',
                    'time' => $vacation->created_at->diffForHumans(),
                    'status' => $vacation->status === 'approved' ? 'success' : ($vacation->status === 'rejected' ? 'error' : 'processing'),
                    'created_at' => $vacation->created_at->toISOString()
                ];
            }

            // Get recent events/projects - Automatically scoped by HasCompany trait
            $recentEvents = Event::with('createdBy')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            foreach ($recentEvents as $event) {
                $activities[] = [
                    'id' => 'event_' . $event->id,
                    'type' => 'project',
                    'module' => 'Projects',
                    'user' => $event->createdBy->name ?? 'Unknown',
                    'action' => 'created project: ' . $event->title,
                    'time' => $event->created_at->diffForHumans(),
                    'status' => 'default',
                    'created_at' => $event->created_at->toISOString()
                ];
            }

            // Get recent leads (CRM) - Automatically scoped by HasCompany trait
            $recentLeads = Lead::with('createdBy')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            foreach ($recentLeads as $lead) {
                $activities[] = [
                    'id' => 'lead_' . $lead->id,
                    'type' => 'lead',
                    'module' => 'CRM',
                    'user' => $lead->createdBy->name ?? 'System',
                    'action' => 'created lead: ' . $lead->full_name,
                    'time' => $lead->created_at->diffForHumans(),
                    'status' => $lead->status,
                    'created_at' => $lead->created_at->toISOString()
                ];
            }

            // Get recent customers - Automatically scoped by HasCompany trait
            $recentCustomers = Customer::with('createdBy')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            foreach ($recentCustomers as $customer) {
                $activities[] = [
                    'id' => 'customer_' . $customer->id,
                    'type' => 'customer',
                    'module' => 'CRM',
                    'user' => $customer->createdBy->name ?? 'System',
                    'action' => 'added customer: ' . $customer->full_name,
                    'time' => $customer->created_at->diffForHumans(),
                    'status' => $customer->status,
                    'created_at' => $customer->created_at->toISOString()
                ];
            }

            // Get recent invoices - Automatically scoped by HasCompany trait
            $recentInvoices = Invoice::with('createdBy', 'customer')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            foreach ($recentInvoices as $invoice) {
                $activities[] = [
                    'id' => 'invoice_' . $invoice->id,
                    'type' => 'invoice',
                    'module' => 'Finance',
                    'user' => $invoice->createdBy->name ?? 'System',
                    'action' => 'created invoice #' . $invoice->invoice_number . ' - $' . number_format($invoice->total_amount, 2),
                    'time' => $invoice->created_at->diffForHumans(),
                    'status' => $invoice->status,
                    'created_at' => $invoice->created_at->toISOString()
                ];
            }

            // Get recent tasks - Automatically scoped by HasCompany trait
            $recentTasks = KanbanTask::with('createdBy', 'board')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            foreach ($recentTasks as $task) {
                $activities[] = [
                    'id' => 'task_' . $task->id,
                    'type' => 'task',
                    'module' => 'Projects',
                    'user' => $task->createdBy->name ?? 'Unknown',
                    'action' => 'created task: ' . $task->title,
                    'time' => $task->created_at->diffForHumans(),
                    'status' => $task->status,
                    'created_at' => $task->created_at->toISOString()
                ];
            }

            // Sort by created_at and limit to 25 most recent
            usort($activities, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json(array_slice($activities, 0, 25));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch activities: ' . $e->getMessage()], 500);
        }
    }

    public function topPerformers()
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }
            
            // Get users that belong to this company via pivot table
            $companyUserIds = DB::table('company_user')
                ->where('company_id', $companyId)
                ->where('status', 'active')
                ->pluck('user_id')
                ->toArray();
            
            if (empty($companyUserIds)) {
                return response()->json([]);
            }
            
            // Get users with most completed vacations (as a metric for engagement)
            $performers = User::with(['vacations', 'department'])
                ->whereIn('id', $companyUserIds)
                ->get()
                ->map(function($user) use ($companyId) {
                    // Only count vacations for this company
                    $completedVacations = $user->vacations()
                        ->where('company_id', $companyId)
                        ->where('status', 'approved')
                        ->where('end_date', '<=', Carbon::now())
                        ->count();
                    
                    $totalVacations = $user->vacations()
                        ->where('company_id', $companyId)
                        ->count();
                    $progress = $totalVacations > 0 ? round(($completedVacations / $totalVacations) * 100) : 0;
                    
                    // Calculate performance score (combine multiple metrics)
                    // Count events created by user in this company
                    $eventsCreated = Event::where('created_by', $user->id)
                        ->where('company_id', $companyId)
                        ->count();
                    $performanceScore = min(100, $progress + ($eventsCreated * 5));

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'department' => $user->department ? [
                            'id' => $user->department->id,
                            'name' => $user->department->name
                        ] : null,
                        'progress' => $performanceScore,
                        'avatar' => $user->avatar
                    ];
                })
                ->sortByDesc('progress')
                ->take(10)
                ->values();

            return response()->json($performers);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch top performers: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get urgent items for the home page
     * Returns time-critical tasks, pending approvals, deadlines, and overdue items
     */
    public function urgentItems(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            $user = $request->user();
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            $urgentItems = [];

            // Check if user can approve vacations (admin/manager with vacations.view permission)
            if (($user->isAdminInCompany($companyId) || $user->roleInCompany($companyId)?->id === 2) && $user->hasPermissionInCompany('vacations.view', $companyId)) {
                $pendingVacationApprovals = Vacation::where('status', 'pending')
                    ->count();
                
                if ($pendingVacationApprovals > 0) {
                    $urgentItems[] = [
                        'id' => 'vacation_approvals',
                        'type' => 'approval',
                        'module' => 'HRM',
                        'title' => "{$pendingVacationApprovals} Pending Leave Approval" . ($pendingVacationApprovals > 1 ? 's' : ''),
                        'description' => 'Requires your attention',
                        'action_url' => '/leaves',
                        'priority' => 'high',
                        'deadline' => null,
                        'count' => $pendingVacationApprovals
                    ];
                }
            }

            // Overdue invoices (for users with invoice view permission)
            if ($user->hasPermissionInCompany('invoices.view', $companyId)) {
                $overdueInvoices = Invoice::where('due_date', '<', Carbon::now())
                    ->where('status', '!=', 'paid')
                    ->count();
                
                if ($overdueInvoices > 0) {
                    $urgentItems[] = [
                        'id' => 'overdue_invoices',
                        'type' => 'overdue',
                        'module' => 'Finance',
                        'title' => "{$overdueInvoices} Overdue Invoice" . ($overdueInvoices > 1 ? 's' : ''),
                        'description' => 'Payment past due date',
                        'action_url' => '/invoices?status=overdue',
                        'priority' => 'high',
                        'deadline' => null,
                        'count' => $overdueInvoices
                    ];
                }
            }

            // Tasks due today (for users with kanban permission)
            if ($user->hasPermissionInCompany('kanban.view', $companyId)) {
                $tasksDueToday = KanbanTask::where('assigned_to', $user->id)
                    ->where('due_date', Carbon::today())
                    ->where('status', '!=', 'done')
                    ->count();
                
                if ($tasksDueToday > 0) {
                    $urgentItems[] = [
                        'id' => 'tasks_due_today',
                        'type' => 'deadline',
                        'module' => 'Projects',
                        'title' => "{$tasksDueToday} Task" . ($tasksDueToday > 1 ? 's' : '') . " Due Today",
                        'description' => 'Deadline is today',
                        'action_url' => '/kanban',
                        'priority' => 'high',
                        'deadline' => Carbon::today()->toDateString(),
                        'count' => $tasksDueToday
                    ];
                }

                // Overdue tasks
                $overdueTasks = KanbanTask::where('assigned_to', $user->id)
                    ->where('due_date', '<', Carbon::today())
                    ->where('status', '!=', 'done')
                    ->count();
                
                if ($overdueTasks > 0) {
                    $urgentItems[] = [
                        'id' => 'overdue_tasks',
                        'type' => 'overdue',
                        'module' => 'Projects',
                        'title' => "{$overdueTasks} Overdue Task" . ($overdueTasks > 1 ? 's' : ''),
                        'description' => 'Past deadline',
                        'action_url' => '/kanban',
                        'priority' => 'critical',
                        'deadline' => null,
                        'count' => $overdueTasks
                    ];
                }
            }

            // User's own pending vacation requests
            $userPendingVacations = Vacation::where('user_id', $user->id)
                ->where('status', 'pending')
                ->count();
            
            if ($userPendingVacations > 0) {
                $urgentItems[] = [
                    'id' => 'my_pending_vacation',
                    'type' => 'pending',
                    'module' => 'HRM',
                    'title' => 'Pending Leave Request',
                    'description' => 'Awaiting approval',
                    'action_url' => '/leaves',
                    'priority' => 'medium',
                    'deadline' => null,
                    'count' => $userPendingVacations
                ];
            }

            // Events/Projects starting today or tomorrow (for users with events permission)
            if ($user->hasPermissionInCompany('events.view', $companyId)) {
                $upcomingEvents = Event::where('start_date', '>=', Carbon::today())
                    ->where('start_date', '<=', Carbon::tomorrow())
                    ->where(function($query) use ($user) {
                        $query->where('created_by', $user->id)
                              ->orWhereHas('participants', function($q) use ($user) {
                                  $q->where('user_id', $user->id);
                              });
                    })
                    ->count();
                
                if ($upcomingEvents > 0) {
                    $urgentItems[] = [
                        'id' => 'upcoming_events',
                        'type' => 'deadline',
                        'module' => 'Projects',
                        'title' => "{$upcomingEvents} Event" . ($upcomingEvents > 1 ? 's' : '') . " Starting Soon",
                        'description' => 'Today or tomorrow',
                        'action_url' => '/calendar',
                        'priority' => 'medium',
                        'deadline' => Carbon::tomorrow()->toDateString(),
                        'count' => $upcomingEvents
                    ];
                }
            }

            // Sort by priority (critical > high > medium)
            $priorityOrder = ['critical' => 3, 'high' => 2, 'medium' => 1];
            usort($urgentItems, function($a, $b) use ($priorityOrder) {
                return ($priorityOrder[$b['priority']] ?? 0) - ($priorityOrder[$a['priority']] ?? 0);
            });

            return response()->json($urgentItems);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch urgent items: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get user context for home page (who am I, what company, role)
     */
    public function userContext(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            $company = request()->attributes->get('current_company');
            $user = $request->user();
            
            if (!$companyId && $company) {
                $companyId = $company->id;
            }
            
            if (!$company && $companyId) {
                $company = Company::find($companyId);
            }

            // Get user's role in this company
            $roleName = 'Employee';
            if ($companyId) {
                $companyUser = DB::table('company_user')
                    ->where('user_id', $user->id)
                    ->where('company_id', $companyId)
                    ->where('status', 'active')
                    ->first();
                
                if ($companyUser) {
                    $role = Role::find($companyUser->role_id);
                    $roleName = $role ? $role->name : 'Employee';
                }
            }

            return response()->json([
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                ],
                'role' => [
                    'id' => $user->role_id,
                    'name' => $roleName,
                ],
                'company' => $company ? [
                    'id' => $company->id,
                    'name' => $company->name,
                    'timezone' => $company->timezone ?? config('app.timezone'),
                    'currency' => $company->currency ?? 'USD',
                ] : null,
                'current_date' => Carbon::now()->toDateString(),
                'current_time' => Carbon::now()->format('H:i'),
                'timezone' => $company->timezone ?? config('app.timezone'),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch user context: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get quick actions available to the user based on permissions
     */
    public function quickActions(Request $request)
    {
        try {
            $companyId = request()->attributes->get('current_company_id') ?? session('current_company_id');
            $user = $request->user();
            
            if (!$companyId) {
                return response()->json(['error' => 'Company context is required'], 400);
            }

            $actions = [];

            // Add Employee (HR Manager/Admin only)
            if ($user->hasPermissionInCompany('employees.create', $companyId)) {
                $actions[] = [
                    'id' => 'add_employee',
                    'label' => 'Add Employee',
                    'url' => '/users_setting',
                    'icon' => 'user-add',
                    'permission' => 'employees.create'
                ];
            }

            // Request Leave (all authenticated users can request leave)
            $actions[] = [
                'id' => 'request_leave',
                'label' => 'Request Leave',
                'url' => '/leaves',
                'icon' => 'calendar',
                'permission' => null // Available to all authenticated users
            ];

            // Create Invoice (Finance permission)
            if ($user->hasPermissionInCompany('invoices.create', $companyId)) {
                $actions[] = [
                    'id' => 'create_invoice',
                    'label' => 'Create Invoice',
                    'url' => '/invoices',
                    'icon' => 'file-add',
                    'permission' => 'invoices.create'
                ];
            }

            // Approve Requests (if admin/manager with approval permission)
            if (($user->isAdminInCompany($companyId) || $user->roleInCompany($companyId)?->id === 2) && $user->hasPermissionInCompany('vacations.view', $companyId)) {
                $pendingCount = Vacation::where('status', 'pending')->count();
                $actions[] = [
                    'id' => 'approve_requests',
                    'label' => 'Approve Requests',
                    'url' => '/leaves',
                    'icon' => 'check-circle',
                    'permission' => 'vacations.view',
                    'badge' => $pendingCount > 0 ? $pendingCount : null
                ];
            }

            // New Project (Project permission)
            if ($user->hasPermissionInCompany('projects.create', $companyId)) {
                $actions[] = [
                    'id' => 'new_project',
                    'label' => 'New Project',
                    'url' => '/projects',
                    'icon' => 'project',
                    'permission' => 'projects.create'
                ];
            }

            // Create Lead (CRM permission)
            if ($user->hasPermissionInCompany('leads.create', $companyId)) {
                $actions[] = [
                    'id' => 'create_lead',
                    'label' => 'Create Lead',
                    'url' => '/leads',
                    'icon' => 'user-add',
                    'permission' => 'leads.create'
                ];
            }

            // Add Customer (CRM permission)
            if ($user->hasPermissionInCompany('customers.create', $companyId)) {
                $actions[] = [
                    'id' => 'add_customer',
                    'label' => 'Add Customer',
                    'url' => '/customers',
                    'icon' => 'user-add',
                    'permission' => 'customers.create'
                ];
            }

            // Create Task (if has kanban view permission, can create tasks)
            if ($user->hasPermissionInCompany('kanban.view', $companyId)) {
                $actions[] = [
                    'id' => 'create_task',
                    'label' => 'Create Task',
                    'url' => '/kanban',
                    'icon' => 'plus-circle',
                    'permission' => 'kanban.view'
                ];
            }

            // Limit to 5 actions max as per requirements
            return response()->json(array_slice($actions, 0, 5));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch quick actions: ' . $e->getMessage()], 500);
        }
    }
}

