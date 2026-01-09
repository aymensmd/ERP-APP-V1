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
    
    // Employees routes - Admin only for create/delete, users can update their own profile
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/{employee}', [EmployeeController::class, 'show']);
    Route::post('/employees', [EmployeeController::class, 'store'])->middleware('admin');
    Route::put('/employees/{employee}', [EmployeeController::class, 'update']); // Allows self-update, admin check in controller
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->middleware('admin');
    
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
    
    // Dashboard routes
    Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
    Route::get('/dashboard/activities', [DashboardController::class, 'recentActivities']);
    Route::get('/dashboard/performers', [DashboardController::class, 'topPerformers']);
    
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
    Route::get('/organizational-chart', [EmployeeProfileController::class, 'getOrganizationalChart']);
    
    // Leads routes (CRM)
    Route::get('/leads', [LeadController::class, 'index']);
    Route::post('/leads', [LeadController::class, 'store']);
    Route::get('/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/leads/{lead}', [LeadController::class, 'update']);
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);
    Route::get('/leads/statistics/overview', [LeadController::class, 'statistics']);
    
    // Kanban Boards routes
    Route::get('/kanban-boards', [KanbanBoardController::class, 'index']);
    Route::post('/kanban-boards', [KanbanBoardController::class, 'store']);
    Route::get('/kanban-boards/{board}', [KanbanBoardController::class, 'show']);
    Route::put('/kanban-boards/{board}', [KanbanBoardController::class, 'update']);
    Route::delete('/kanban-boards/{board}', [KanbanBoardController::class, 'destroy']);
    
    // Kanban Tasks routes
    Route::post('/kanban-tasks', [KanbanTaskController::class, 'store']);
    Route::put('/kanban-tasks/{task}', [KanbanTaskController::class, 'update']);
    Route::put('/kanban-tasks/positions/update', [KanbanTaskController::class, 'updatePositions']);
    Route::delete('/kanban-tasks/{task}', [KanbanTaskController::class, 'destroy']);
    Route::post('/kanban-tasks/{task}/dependencies', [KanbanTaskController::class, 'addDependency']);
    Route::delete('/task-dependencies/{dependency}', [KanbanTaskController::class, 'removeDependency']);
    
    // Customers routes (CRM)
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
    Route::post('/leads/{lead}/convert', [CustomerController::class, 'convertFromLead']);
    
    // Communications routes
    Route::get('/communications', [CommunicationController::class, 'index']);
    Route::post('/communications', [CommunicationController::class, 'store']);
    Route::put('/communications/{communication}', [CommunicationController::class, 'update']);
    Route::delete('/communications/{communication}', [CommunicationController::class, 'destroy']);
    
    // Invoices routes
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'generatePdf']);
    
    // Payments routes
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);
    
    // Onboarding routes
    Route::get('/onboarding/checklist', [OnboardingController::class, 'index']);
    Route::get('/onboarding/checklist/{userId}', [OnboardingController::class, 'index']);
    Route::post('/onboarding/checklist/{userId}/create', [OnboardingController::class, 'createChecklist']);
    Route::post('/onboarding/checklist/{userId}/add', [OnboardingController::class, 'addItem']);
    Route::put('/onboarding/items/{itemId}', [OnboardingController::class, 'updateItem']);
    Route::delete('/onboarding/items/{itemId}', [OnboardingController::class, 'deleteItem']);
    Route::get('/onboarding/template', [OnboardingController::class, 'getTemplate']);
    
    // Shifts routes
    Route::get('/shifts', [ShiftController::class, 'index']);
    Route::post('/shifts', [ShiftController::class, 'store']);
    Route::get('/shifts/{shift}', [ShiftController::class, 'show']);
    Route::put('/shifts/{shift}', [ShiftController::class, 'update']);
    Route::delete('/shifts/{shift}', [ShiftController::class, 'destroy']);
    Route::get('/shift-assignments', [ShiftController::class, 'assignments']);
    Route::post('/shift-assignments', [ShiftController::class, 'assignShift']);
    Route::put('/shift-assignments/{assignment}', [ShiftController::class, 'updateAssignment']);
    Route::delete('/shift-assignments/{assignment}', [ShiftController::class, 'deleteAssignment']);
    });
});
