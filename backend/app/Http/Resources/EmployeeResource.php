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
            'vacations' => $this->whenLoaded('vacations', function () {
                return VacationResource::collection($this->vacations);
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

