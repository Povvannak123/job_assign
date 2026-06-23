<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StaffTaskController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskTemplateController;
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
            Route::post('/tasks/assign-daily', [TaskController::class, 'assignDaily']);
            Route::get('/dashboard', [DashboardController::class, 'index']);
            Route::get('/reports', [DashboardController::class, 'report']);
            Route::get('/performance', [PerformanceController::class, 'index']);

            // Task Template management
            Route::get('/task-templates', [TaskTemplateController::class, 'index']);
            Route::get('/task-templates/{staffId}', [TaskTemplateController::class, 'show']);
            Route::post('/task-templates/{staffId}/items', [TaskTemplateController::class, 'store']);
            Route::post('/task-templates/{staffId}/reorder', [TaskTemplateController::class, 'reorder']);
            Route::put('/task-templates/items/{id}', [TaskTemplateController::class, 'update']);
            Route::delete('/task-templates/items/{id}', [TaskTemplateController::class, 'destroy']);

            // Settings
            Route::get('/settings', [SettingsController::class, 'index']);
            Route::put('/settings', [SettingsController::class, 'update']);
        });

        // Profile & password (any authenticated user)
        Route::post('/settings/profile', [SettingsController::class, 'updateProfile']);
        Route::put('/settings/password', [SettingsController::class, 'updatePassword']);

        // Notifications (any authenticated user)
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

        // Staff routes
        Route::middleware('staff')->group(function () {
            Route::get('/my-tasks', [StaffTaskController::class, 'index']);
            Route::put('/my-tasks/{id}/status', [StaffTaskController::class, 'updateStatus']);
            Route::post('/my-tasks/{id}/comment', [CommentController::class, 'store']);
        });
    });
});
