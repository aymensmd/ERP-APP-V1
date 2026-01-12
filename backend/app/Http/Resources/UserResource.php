<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request) {
        // Get company context for permissions
        $companyId = $request->attributes->get('current_company_id') ?? 
                     session('current_company_id') ?? 
                     ($request->header('X-Company-ID') ? (int)$request->header('X-Company-ID') : null);
        
        // Get user's permissions in the current company
        $permissions = [];
        if ($companyId) {
            $companyUser = DB::table('company_user')
                ->where('user_id', $this->id)
                ->where('company_id', $companyId)
                ->where('status', 'active')
                ->first();
            
            if ($companyUser) {
                // Admin has all permissions
                if ($companyUser->role_id === 1) {
                    $permissions = \App\Models\Permission::all()->pluck('name')->toArray();
                } else {
                    // Get custom permissions override
                    $customPermissions = json_decode($companyUser->permissions ?? '[]', true);
                    
                    // Get role permissions
                    $rolePermissions = DB::table('role_permission')
                        ->join('permissions', 'role_permission.permission_id', '=', 'permissions.id')
                        ->where('role_permission.role_id', $companyUser->role_id)
                        ->pluck('permissions.name')
                        ->toArray();
                    
                    $permissions = array_unique(array_merge($rolePermissions, $customPermissions));
                }
            }
        }
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_platform_admin' => (bool)$this->is_platform_admin,
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
            'permissions' => $permissions,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
