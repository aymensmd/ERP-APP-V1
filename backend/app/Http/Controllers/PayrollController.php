<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\User;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $companyId = $request->attributes->get('current_company_id');
        
        $query = Payroll::where('company_id', $companyId)->with('user');
        
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        
        if ($request->has('month')) {
            $date = Carbon::parse($request->month);
            $query->whereMonth('pay_period_start', $date->month)
                  ->whereYear('pay_period_start', $date->year);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Generate payroll for a user or all users.
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable|exists:users,id', // If null, generate for all
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $companyId = $request->attributes->get('current_company_id');
        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        $users = $request->user_id 
            ? User::where('id', $request->user_id)->whereHas('companies', function($q) use ($companyId) {
                $q->where('companies.id', $companyId);
            })->get()
            : User::whereHas('companies', function($q) use ($companyId) {
                $q->where('companies.id', $companyId)->where('company_user.status', 'active');
            })->get();

        $generated = [];

        foreach ($users as $user) {
            // Calculate base salary (pro-rated if needed, simplified here)
            // Assuming monthly salary field exists on user
            $monthlySalary = $user->salary ?? 0;
            
            // Calculate Overtime from Attendance
            $overtimeHours = AttendanceRecord::where('user_id', $user->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->sum('overtime_hours');
            
            // Simplified overtime rate (1.5x hourly rate)
            // Assuming 160 hours per month standard
            $hourlyRate = $monthlySalary / 160;
            $overtimeAmount = $overtimeHours * $hourlyRate * 1.5;

            // Bonuses and Deductions (placeholder logic or passed in request)
            $bonuses = 0; 
            $deductions = 0;

            $netSalary = $monthlySalary + $overtimeAmount + $bonuses - $deductions;

            $payroll = Payroll::updateOrCreate(
                [
                    'company_id' => $companyId,
                    'user_id' => $user->id,
                    'pay_period_start' => $startDate->format('Y-m-d'),
                    'pay_period_end' => $endDate->format('Y-m-d'),
                ],
                [
                    'base_salary' => $monthlySalary,
                    'overtime_hours' => $overtimeHours,
                    'overtime_amount' => $overtimeAmount,
                    'bonuses' => $bonuses,
                    'deductions' => $deductions,
                    'net_salary' => $netSalary,
                    'status' => 'draft'
                ]
            );

            $generated[] = $payroll;
        }

        return response()->json(['message' => 'Payroll generated', 'data' => $generated]);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $payroll = Payroll::with('user')->findOrFail($id);
        return response()->json($payroll);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,processed,paid',
            'bonuses' => 'sometimes|numeric',
            'deductions' => 'sometimes|numeric',
        ]);

        if (isset($validated['bonuses']) || isset($validated['deductions'])) {
            // Recalculate net
            $bonuses = $validated['bonuses'] ?? $payroll->bonuses;
            $deductions = $validated['deductions'] ?? $payroll->deductions;
            $validated['net_salary'] = $payroll->base_salary + $payroll->overtime_amount + $bonuses - $deductions;
        }

        if (isset($validated['status']) && $validated['status'] === 'paid') {
            $validated['payment_date'] = now();
        }

        $payroll->update($validated);

        return response()->json($payroll);
    }
}
