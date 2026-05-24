<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StaffTaskController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public routes
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Admin-only routes
        Route::middleware('admin')->group(function () {
            Route::get('/users/all-staff', [UserController::class, 'allStaff']);
            Route::apiResource('/users', UserController::class);
            Route::apiResource('/tasks', TaskController::class);
            Route::get('/dashboard', [DashboardController::class, 'index']);
            Route::get('/reports', [DashboardController::class, 'report']);
        });

        // Staff routes
        Route::middleware('staff')->group(function () {
            Route::get('/my-tasks', [StaffTaskController::class, 'index']);
            Route::put('/my-tasks/{id}/status', [StaffTaskController::class, 'updateStatus']);
            Route::post('/my-tasks/{id}/comment', [CommentController::class, 'store']);
        });
    });
});
