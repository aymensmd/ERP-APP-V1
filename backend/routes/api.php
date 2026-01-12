<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\VacationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TimeTrackingController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\EmployeeProfileController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\KanbanBoardController;
use App\Http\Controllers\KanbanTaskController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CommunicationController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes - require authentication (tenant middleware is optional here, applied per route)
Route::middleware('auth:sanctum')->group(function () {
    // Authentication routes (no tenant required)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Company routes (no tenant required for company management)
    Route::get('/companies', [CompanyController::class, 'index'])->middleware('admin');
    Route::post('/companies', [CompanyController::class, 'store']);
    Route::get('/companies/my', [CompanyController::class, 'myCompanies']);
    Route::get('/companies/{company}', [CompanyController::class, 'show']);
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->middleware('admin');
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->middleware('admin');
    Route::post('/companies/{company}/switch', [CompanyController::class, 'switchCompany']);
    
    // All other routes require tenant context
    Route::middleware('tenant')->group(function () {
    
    // Store user/employee (used by admin/user management form) - Admin only
    Route::post('/store', [AuthController::class, 'store'])->middleware('admin');
    
    // Departments routes - Admin only for create/update/delete
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/departments/{department}', [DepartmentController::class, 'show']);
    Route::post('/departments', [DepartmentController::class, 'store'])->middleware('admin');
    Route::put('/departments/{department}', [DepartmentController::class, 'update'])->middleware('admin');
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->middleware('admin');
    
    // Roles and Permissions routes
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store'])->middleware('admin');
    Route::get('/roles/{role}', [RoleController::class, 'show']);
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('admin');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('admin');
    Route::get('/permissions', [PermissionController::class, 'index'])->middleware('permission:permissions.view');
    
    // Employees routes - Permission-based access
    Route::get('/employees', [EmployeeController::class, 'index'])->middleware('permission:employees.view');
    Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->middleware('permission:employees.view');
    Route::post('/employees', [EmployeeController::class, 'store'])->middleware('permission:employees.create');
    Route::put('/employees/{employee}', [EmployeeController::class, 'update']); // Permission check in controller (allows self-update)
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->middleware('permission:employees.delete');
    
    // Events routes - Admin only for delete, users can create/update their own
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->middleware('admin');
    
    // Vacations routes - specific routes first (with action suffixes)
    // Approve/Reject routes are admin-only
    Route::put('/vacations/{vacation}/approve', [VacationController::class, 'approve'])->middleware('admin');
    Route::put('/vacations/{vacation}/reject', [VacationController::class, 'reject'])->middleware('admin');
    Route::get('/vacations/{vacation}', [VacationController::class, 'show']); // RESTful naming
    Route::put('/vacations/{vacation}', [VacationController::class, 'update']);
    Route::delete('/vacations/{vacation}', [VacationController::class, 'destroy']);
    
    // Vacation listing - use query parameter: ?user_id=123
    Route::get('/vacations', [VacationController::class, 'index']); // Query param: ?user_id=123
    Route::post('/vacations', [VacationController::class, 'store']);
    
    // Home page routes - Accessible to all authenticated users
    Route::get('/home/user-context', [DashboardController::class, 'userContext']);
    Route::get('/home/urgent-items', [DashboardController::class, 'urgentItems']);
    Route::get('/home/quick-actions', [DashboardController::class, 'quickActions']);
    
    // Dashboard routes - Protected with dashboard permission
    Route::get('/dashboard/statistics', [DashboardController::class, 'statistics'])->middleware('permission:dashboard.view');
    Route::get('/dashboard/activities', [DashboardController::class, 'recentActivities'])->middleware('permission:dashboard.view');
    Route::get('/dashboard/performers', [DashboardController::class, 'topPerformers'])->middleware('permission:dashboard.view');
    
    // Projects routes (projects are events)
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
    
    // Reports routes
    Route::post('/reports/generate', [ReportController::class, 'generate']);
    
    // Notifications routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    
    // Time Tracking routes
    Route::get('/time-tracking/sessions', [TimeTrackingController::class, 'index']);
    Route::post('/time-tracking/sessions', [TimeTrackingController::class, 'store']);
    Route::delete('/time-tracking/sessions/{id}', [TimeTrackingController::class, 'destroy']);
    
    // Analytics routes
    Route::get('/analytics', [AnalyticsController::class, 'index']);
    
    // Audit Logs routes (Admin only)
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('admin');
    Route::get('/audit-logs/{id}', [AuditLogController::class, 'show'])->middleware('admin');
    Route::get('/audit-logs/model/{modelType}/{modelId}', [AuditLogController::class, 'forModel']);
    Route::get('/audit-logs/export', [AuditLogController::class, 'export'])->middleware('admin');
    
    // Employee Profile routes (Documents, Skills, Certifications)
    Route::get('/employees/{userId}/profile', [EmployeeProfileController::class, 'show']);
    Route::post('/employees/{userId}/documents', [EmployeeProfileController::class, 'uploadDocument']);
    Route::delete('/documents/{documentId}', [EmployeeProfileController::class, 'deleteDocument']);
    Route::post('/employees/{userId}/skills', [EmployeeProfileController::class, 'addSkill']);
    Route::put('/skills/{skillId}', [EmployeeProfileController::class, 'updateSkill']);
    Route::delete('/skills/{skillId}', [EmployeeProfileController::class, 'deleteSkill']);
    Route::post('/employees/{userId}/certifications', [EmployeeProfileController::class, 'addCertification']);
    Route::put('/certifications/{certificationId}', [EmployeeProfileController::class, 'updateCertification']);
    Route::delete('/certifications/{certificationId}', [EmployeeProfileController::class, 'deleteCertification']);
    Route::get('/organizational-chart', [App\Http\Controllers\HierarchyController::class, 'index'])->middleware('permission:org-chart.view');
    Route::get('/hierarchy/my-team', [App\Http\Controllers\HierarchyController::class, 'myTeam']);
    Route::get('/departments/tree', [DepartmentController::class, 'tree']); // New method we might need later
    
    // Leads routes (CRM)
    Route::get('/leads', [LeadController::class, 'index'])->middleware('permission:leads.view');
    Route::post('/leads', [LeadController::class, 'store'])->middleware('permission:leads.create');
    Route::get('/leads/{lead}', [LeadController::class, 'show'])->middleware('permission:leads.view');
    Route::put('/leads/{lead}', [LeadController::class, 'update'])->middleware('permission:leads.update');
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy'])->middleware('permission:leads.delete');
    Route::get('/leads/statistics/overview', [LeadController::class, 'statistics'])->middleware('permission:leads.view');
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert'])->middleware('permission:leads.convert');
    
    // Kanban Boards routes
    Route::get('/kanban-boards', [KanbanBoardController::class, 'index'])->middleware('permission:kanban.view');
    Route::post('/kanban-boards', [KanbanBoardController::class, 'store'])->middleware('permission:kanban.create');
    Route::get('/kanban-boards/{board}', [KanbanBoardController::class, 'show'])->middleware('permission:kanban.view');
    Route::put('/kanban-boards/{board}', [KanbanBoardController::class, 'update'])->middleware('permission:kanban.update');
    Route::delete('/kanban-boards/{board}', [KanbanBoardController::class, 'destroy'])->middleware('permission:kanban.delete');
    
    // Kanban Tasks routes
    Route::post('/kanban-tasks', [KanbanTaskController::class, 'store']);
    Route::put('/kanban-tasks/{task}', [KanbanTaskController::class, 'update']);
    Route::put('/kanban-tasks/positions/update', [KanbanTaskController::class, 'updatePositions']);
    Route::delete('/kanban-tasks/{task}', [KanbanTaskController::class, 'destroy']);
    Route::post('/kanban-tasks/{task}/dependencies', [KanbanTaskController::class, 'addDependency']);
    Route::delete('/task-dependencies/{dependency}', [KanbanTaskController::class, 'removeDependency']);
    
    // Customers routes (CRM)
    Route::get('/customers', [CustomerController::class, 'index'])->middleware('permission:customers.view');
    Route::post('/customers', [CustomerController::class, 'store'])->middleware('permission:customers.create');
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->middleware('permission:customers.view');
    Route::put('/customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:customers.update');
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->middleware('permission:customers.delete');
    Route::post('/leads/{lead}/convert', [CustomerController::class, 'convertFromLead'])->middleware('permission:leads.convert');
    
    // Communications routes
    Route::get('/communications', [CommunicationController::class, 'index']);
    Route::post('/communications', [CommunicationController::class, 'store']);
    Route::put('/communications/{communication}', [CommunicationController::class, 'update']);
    Route::delete('/communications/{communication}', [CommunicationController::class, 'destroy']);
    
    // Invoices routes
    Route::get('/invoices', [InvoiceController::class, 'index'])->middleware('permission:invoices.view');
    Route::post('/invoices', [InvoiceController::class, 'store'])->middleware('permission:invoices.create');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:invoices.view');
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->middleware('permission:invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:invoices.delete');
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'generatePdf'])->middleware('permission:invoices.view');
    
    // Payments routes
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);
    
    // Onboarding routes
    Route::get('/onboarding/checklist', [OnboardingController::class, 'index'])->middleware('permission:onboarding.view');
    Route::get('/onboarding/checklist/{userId}', [OnboardingController::class, 'index'])->middleware('permission:onboarding.view');
    Route::post('/onboarding/checklist/{userId}/create', [OnboardingController::class, 'createChecklist'])->middleware('permission:onboarding.create');
    Route::post('/onboarding/checklist/{userId}/add', [OnboardingController::class, 'addItem'])->middleware('permission:onboarding.create');
    Route::put('/onboarding/items/{itemId}', [OnboardingController::class, 'updateItem'])->middleware('permission:onboarding.update');
    Route::delete('/onboarding/items/{itemId}', [OnboardingController::class, 'deleteItem'])->middleware('permission:onboarding.delete');
    Route::get('/onboarding/template', [OnboardingController::class, 'getTemplate'])->middleware('permission:onboarding.view');
    
    // Shifts routes
    Route::get('/shifts', [ShiftController::class, 'index'])->middleware('permission:shifts.view');
    Route::post('/shifts', [ShiftController::class, 'store'])->middleware('permission:shifts.create');
    Route::get('/shifts/{shift}', [ShiftController::class, 'show'])->middleware('permission:shifts.view');
    Route::put('/shifts/{shift}', [ShiftController::class, 'update'])->middleware('permission:shifts.update');
    Route::delete('/shifts/{shift}', [ShiftController::class, 'destroy'])->middleware('permission:shifts.delete');
    Route::get('/shift-assignments', [ShiftController::class, 'assignments'])->middleware('permission:shifts.view');
    Route::post('/shift-assignments', [ShiftController::class, 'assignShift'])->middleware('permission:shifts.create');
    Route::put('/shift-assignments/{assignment}', [ShiftController::class, 'updateAssignment'])->middleware('permission:shifts.update');
    Route::delete('/shift-assignments/{assignment}', [ShiftController::class, 'deleteAssignment'])->middleware('permission:shifts.delete');
    });
});
