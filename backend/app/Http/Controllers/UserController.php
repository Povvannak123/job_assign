<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', UserRole::STAFF);

        if ($request->filled('search')) {
            $term = '%' . addcslashes($request->search, '%_\\') . '%';
            $query->where(function ($q) use ($term) {
                $driver = $q->getConnection()->getDriverName();
                if ($driver === 'pgsql') {
                    $q->where('name', 'ilike', $term)
                        ->orWhere('email', 'ilike', $term);
                } else {
                    $q->whereRaw('LOWER(name) LIKE LOWER(?)', [$term])
                        ->orWhereRaw('LOWER(email) LIKE LOWER(?)', [$term]);
                }
            });
        }

        $users = $query->orderBy('name')->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $users->items(),
            'meta'    => [
                'total'        => $users->total(),
                'per_page'     => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:50',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:6',
            'position'     => 'required|string|max:50',
            'phone_number' => 'nullable|string|max:10',
            'location_row' => 'nullable|string|max:100',
            'day_off'      => 'nullable|string|max:20',
            'store_name'   => 'nullable|string|max:50',
            'shift'        => 'nullable|in:Morning,Evening',
        ]);

        $nullable = ['phone_number', 'location_row', 'day_off', 'store_name', 'shift'];
        $optional = [];
        foreach ($nullable as $key) {
            $v = $request->input($key);
            $optional[$key] = ($v === null || $v === '') ? null : $v;
        }

        try {
            $user = User::create([
                'name'         => $request->name,
                'email'        => $request->email,
                'password'     => Hash::make($request->password),
                'role'         => UserRole::STAFF,
                'position'     => $request->position,
                'phone_number' => $optional['phone_number'],
                'location_row' => $optional['location_row'],
                'day_off'      => $optional['day_off'],
                'store_name'   => $optional['store_name'],
                'shift'        => $optional['shift'],
                'is_active'    => true,
            ]);
        } catch (QueryException $e) {
            report($e);

            $sql = $e->getMessage();
            if (str_contains($sql, '23505') || str_contains($sql, 'Duplicate') || str_contains($sql, 'UNIQUE')) {
                return response()->json([
                    'success' => false,
                    'message' => 'This email is already registered.',
                    'errors'  => ['email' => ['The email has already been taken.']],
                ], 422);
            }

            $hint = 'Could not create the staff account.';
            if (str_contains($sql, 'Undefined column') || str_contains($sql, 'does not exist')) {
                $hint .= ' Run database migrations from the backend folder: php artisan migrate';
            }

            return response()->json([
                'success' => false,
                'message' => $hint . (config('app.debug') ? ' ' . $sql : ''),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff account created successfully.',
            'data'    => $user,
        ], 201);
    }

    public function show(User $user)
    {
        if ($user->role !== UserRole::STAFF) {
            abort(404);
        }

        return response()->json([
            'success' => true,
            'data'    => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        if ($user->role !== UserRole::STAFF) {
            abort(404);
        }

        $request->validate([
            'name'         => 'sometimes|required|string|max:50',
            'email'        => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password'     => 'nullable|string|min:6',
            'is_active'    => 'sometimes|boolean',
            'position'     => 'sometimes|required|string|max:50',
            'phone_number' => 'nullable|string|max:10',
            'location_row' => 'nullable|string|max:100',
            'day_off'      => 'nullable|string|max:20',
            'store_name'   => 'nullable|string|max:50',
            'shift'        => 'nullable|in:Morning,Evening',
        ]);

        $data = $request->only([
            'name', 'email', 'is_active', 'position',
            'phone_number', 'location_row', 'day_off', 'store_name', 'shift',
        ]);

        foreach (['phone_number', 'location_row', 'day_off', 'store_name', 'shift'] as $nullable) {
            if (array_key_exists($nullable, $data) && $data[$nullable] === '') {
                $data[$nullable] = null;
            }
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        try {
            $user->update($data);
        } catch (QueryException $e) {
            report($e);

            $sql = $e->getMessage();
            if (str_contains($sql, '23505') || str_contains($sql, 'Duplicate') || str_contains($sql, 'UNIQUE')) {
                return response()->json([
                    'success' => false,
                    'message' => 'This email is already registered.',
                    'errors'  => ['email' => ['The email has already been taken.']],
                ], 422);
            }

            return response()->json([
                'success' => false,
                'message' => 'Could not update the staff account.' . (config('app.debug') ? ' ' . $sql : ''),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Staff account updated successfully.',
            'data'    => $user->fresh(),
        ]);
    }

    public function destroy(User $user)
    {
        if ($user->role !== UserRole::STAFF) {
            abort(404);
        }

        $user->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Staff account deactivated.',
        ]);
    }

    public function allStaff()
    {
        $staff = User::where('role', UserRole::STAFF)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'position']);

        return response()->json([
            'success' => true,
            'data'    => $staff,
        ]);
    }
}
