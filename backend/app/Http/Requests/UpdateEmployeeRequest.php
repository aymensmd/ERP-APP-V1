<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
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
        $employee = $this->route('employee');
        $userId = $employee ? (is_object($employee) ? $employee->id : $employee) : null;

        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $userId,
            'password' => 'sometimes|nullable|string|min:6',
            'old_password' => 'required_with:password|string', // Required when updating password
            'date_of_birth' => 'nullable|date',
            'genre' => 'nullable|in:Male,Female',
            'address' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'sos_number' => 'nullable|string|max:20',
            'social_situation' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'role' => 'nullable|string|in:Admin,Moderator',
            'department' => 'nullable|string',
        ];
    }
}

