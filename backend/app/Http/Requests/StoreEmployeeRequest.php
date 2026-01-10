<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'employee_id' => 'nullable|string|max:50|unique:users',
            'date_of_birth' => 'nullable|date',
            'genre' => 'nullable|in:Male,Female',
            'address' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'sos_number' => 'nullable|string|max:20',
            'social_situation' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'role_id' => 'required|exists:roles,id',
            'manager_id' => 'nullable|exists:users,id',
            'position' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'salary' => 'nullable|numeric|min:0',
            'employment_type' => 'nullable|in:full-time,part-time,contract,intern,freelance',
            'status' => 'nullable|in:active,inactive,on-leave,terminated',
            'notes' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'permissions' => 'nullable|array', // Custom permissions override
            'permissions.*' => 'string|exists:permissions,name',
        ];
    }
}





