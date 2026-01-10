<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions.
     */
    public function index(Request $request)
    {
        $permissions = Permission::orderBy('group')->orderBy('sort_order')->get();
        return response()->json($permissions);
    }
}
