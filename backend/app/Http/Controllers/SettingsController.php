<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    // GET /settings — return all settings grouped
    public function index()
    {
        return response()->json([
            'success' => true,
            'data'    => Setting::allGrouped(),
        ]);
    }

    // PUT /settings — bulk update one or more settings
    public function update(Request $request)
    {
        $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string|max:100',
            'settings.*.value' => 'nullable|string|max:1000',
            'settings.*.group' => 'nullable|string|max:50',
        ]);

        foreach ($request->settings as $item) {
            Setting::set(
                $item['key'],
                $item['value'] ?? null,
                $item['group'] ?? 'general'
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully.',
            'data'    => Setting::allGrouped(),
        ]);
    }

    // PUT /settings/profile — update authenticated admin's profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'         => 'required|string|max:50',
            'email'        => 'required|email|unique:users,email,' . $user->id,
            'phone_number' => 'nullable|string|max:20',
            'position'     => 'nullable|string|max:50',
            'avatar'       => 'nullable|image|max:4096',
            'remove_avatar'=> 'nullable|string',
        ]);

        $data = $request->only(['name', 'email', 'phone_number', 'position']);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->input('remove_avatar') === '1') {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = null;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data'    => $user->fresh(),
        ]);
    }

    // PUT /settings/password — change authenticated user's password
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
                'errors'  => ['current_password' => ['The current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}
