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
            'date_of_birth' => 'nullable|date',
            'genre' => 'nullable|in:Male,Female',
            'address' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'sos_number' => 'nullable|string|max:20',
            'social_situation' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'role_id' => 'nullable|exists:roles,id',
        ];
    }
}





