<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller {
    // register a new user method
    public function register(RegisterRequest $request) {

        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'genre' => $data['genre'] ?? null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $cookie = cookie('token', $token, 60 * 24); // 1 day

        return response()->json([
            'user' => new UserResource($user),
        ])->withCookie($cookie);
    }

    // login a user method
    public function login(LoginRequest $request) {
        try {
            $data = $request->validated();

            $user = User::where('email', $data['email'])->first();

            if (!$user || !Hash::check($data['password'], $user->password)) {
                return response()->json([
                    'message' => 'Email or password is incorrect!'
                ], 401);
            }

            // Load relationships if they exist
            $user->load(['department', 'role']);

            // Get the first active company for the user to set context
            $companyId = $request->header('X-Company-ID');
            if (!$companyId) {
                $firstCompany = $user->companies()->wherePivot('status', 'active')->first();
                if ($firstCompany) {
                    $companyId = $firstCompany->id;
                    // Set company context for the request
                    $request->attributes->set('current_company_id', $companyId);
                }
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            $cookie = cookie('token', $token, 60 * 24); // 1 day

            // Create UserResource with company context
            $userResource = new UserResource($user);
            if ($companyId) {
                $request->attributes->set('current_company_id', $companyId);
            }

            return response()->json([
                'token' => $token,
                'user' => $userResource->toArray($request),
            ])->withCookie($cookie);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during login. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    // logout a user method
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();

        $cookie = cookie()->forget('token');

        return response()->json([
            'message' => 'Logged out successfully!'
        ])->withCookie($cookie);
    }

    // get the authenticated user method
    public function user(Request $request) {
        $user = $request->user();
        $user->load(['department', 'role']);
        
        // Ensure company context is set for permissions
        $companyId = $request->header('X-Company-ID') ?? 
                     $request->attributes->get('current_company_id') ?? 
                     session('current_company_id');
        if ($companyId) {
            $request->attributes->set('current_company_id', $companyId);
        }
        
        $userResource = new UserResource($user);
        return response()->json($userResource->toArray($request));
    }

    // store/create employee with full profile (used by admin/user management)
    public function store(StoreEmployeeRequest $request) {
        $data = $request->validated();

        // Map role name to role_id if needed
        if (isset($data['role']) && !isset($data['role_id'])) {
            $role = \App\Models\Role::where('name', $data['role'])->first();
            if ($role) {
                $data['role_id'] = $role->id;
            }
            unset($data['role']);
        }

        // Map department name to department_id if needed
        if (isset($data['department']) && !isset($data['department_id'])) {
            $department = \App\Models\Department::where('name', $data['department'])->first();
            if ($department) {
                $data['department_id'] = $department->id;
            }
            unset($data['department']);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'genre' => $data['genre'] ?? null,
            'address' => $data['address'] ?? $data['adress'] ?? null,
            'phone_number' => $data['phone_number'] ?? null,
            'sos_number' => $data['sos_number'] ?? null,
            'social_situation' => $data['social_situation'] ?? null,
            'department_id' => $data['department_id'] ?? null,
            'role_id' => $data['role_id'] ?? null,
        ]);

        $user->load(['department', 'role']);

        return response()->json([
            'message' => 'User created successfully',
            'user' => new UserResource($user),
        ], 201);
    }
}
