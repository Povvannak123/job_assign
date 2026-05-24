<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== UserRole::STAFF) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Staff access required.',
            ], 403);
        }

        return $next($request);
    }
}
