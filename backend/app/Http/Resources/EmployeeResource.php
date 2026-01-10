<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'employee_id' => $this->employee_id,
            'name' => $this->name,
            'email' => $this->email,
            'date_of_birth' => $this->date_of_birth,
            'genre' => $this->genre,
            'address' => $this->address,
            'phone_number' => $this->phone_number,
            'sos_number' => $this->sos_number,
            'social_situation' => $this->social_situation,
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department', function () {
                return new DepartmentResource($this->department);
            }),
            'role_id' => $this->role_id,
            'role' => $this->whenLoaded('role', function () {
                return new RoleResource($this->role);
            }),
            'manager_id' => $this->manager_id,
            'manager' => $this->whenLoaded('manager', function () {
                return [
                    'id' => $this->manager->id,
                    'name' => $this->manager->name,
                    'email' => $this->manager->email,
                ];
            }),
            'position' => $this->position,
            'hire_date' => $this->hire_date,
            'salary' => $this->salary ? (float)$this->salary : null,
            'employment_type' => $this->employment_type,
            'status' => $this->status,
            'notes' => $this->notes,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'emergency_contact_relation' => $this->emergency_contact_relation,
            'vacations' => $this->whenLoaded('vacations', function () {
                return VacationResource::collection($this->vacations);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

