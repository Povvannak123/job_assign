<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $input = trim($request->username);

        // Try staff_id first (exact or zero-padded match)
        $user = User::where('staff_id', $input)
            ->orWhere('staff_id', ltrim($input, '0') ?: '0')
            ->first();

        // Fall back to database id for backward compatibility
        if (!$user) {
            $userId = (int) $input;
            $user = $userId > 0 ? User::find($userId) : null;
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact admin.',
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role->value,
                'position'   => $user->position,
                'avatar'     => $user->avatar,
                'avatar_url' => $user->avatar_url,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role->value,
                'position'     => $user->position,
                'avatar'       => $user->avatar,
                'avatar_url'   => $user->avatar_url,
                'is_active'    => $user->is_active,
                'phone_number' => $user->phone_number,
                'shift'        => $user->shift,
                'store_name'   => $user->store_name,
                'location_row' => $user->location_row,
                'day_off'      => $user->day_off,
            ],
        ]);
    }
}
