<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalTasks    = Task::count();
        $completed     = Task::where('status', TaskStatus::COMPLETED)->count();
        $inProgress    = Task::where('status', TaskStatus::IN_PROGRESS)->count();
        $notStarted    = Task::where('status', TaskStatus::NOT_STARTED)->count();
        $overdue       = Task::where('status', '!=', TaskStatus::COMPLETED)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', today())
            ->count();

        $today = today()->toDateString();
        $todayTasks = Task::with(['assignedUser:id,name', 'creator:id,name'])
            ->whereDate('due_date', $today)
            ->get();

        $staffSummary = User::where('role', UserRole::STAFF)
            ->get()
            ->map(function ($user) {
                $tasks       = Task::where('assigned_to', $user->id)->get();
                $total       = $tasks->count();
                $completedCount = $tasks->where('status', TaskStatus::COMPLETED)->count();
                $inProgressCount = $tasks->where('status', TaskStatus::IN_PROGRESS)->count();
                $overdueCount = $tasks->filter(function ($t) {
                    return $t->is_overdue;
                })->count();

                return [
                    'id'               => $user->id,
                    'name'             => $user->name,
                    'total'            => $total,
                    'completed'        => $completedCount,
                    'in_progress'      => $inProgressCount,
                    'overdue'          => $overdueCount,
                    'performance_rate' => $total > 0 ? round(($completedCount / $total) * 100) : 0,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'total_tasks'   => $totalTasks,
                'completed'     => $completed,
                'in_progress'   => $inProgress,
                'not_started'   => $notStarted,
                'overdue'       => $overdue,
                'today_tasks'   => $todayTasks,
                'staff_summary' => $staffSummary,
            ],
        ]);
    }

    public function report(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to'   => 'nullable|date',
        ]);

        $staffSummary = User::where('role', UserRole::STAFF)
            ->get()
            ->map(function ($user) use ($request) {
                $query = Task::where('assigned_to', $user->id);

                if ($request->filled('date_from')) {
                    $query->whereDate('created_at', '>=', $request->date_from);
                }
                if ($request->filled('date_to')) {
                    $query->whereDate('created_at', '<=', $request->date_to);
                }

                $tasks    = $query->get();
                $assigned = $tasks->count();
                $completedTasks = $tasks->where('status', TaskStatus::COMPLETED);
                $completedCount = $completedTasks->count();

                $lateCount = $completedTasks->filter(function ($t) {
                    return $t->completed_at && $t->due_date && $t->completed_at->toDateString() > $t->due_date->toDateString();
                })->count();

                $onTime   = $completedCount - $lateCount;
                $rate     = $assigned > 0 ? round(($completedCount / $assigned) * 100) : 0;

                return [
                    'id'        => $user->id,
                    'name'      => $user->name,
                    'assigned'  => $assigned,
                    'completed' => $completedCount,
                    'late'      => $lateCount,
                    'on_time'   => $onTime,
                    'rate'      => $rate,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $staffSummary,
        ]);
    }
}
