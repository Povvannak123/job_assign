<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'year'  => 'nullable|integer|min:2020|max:2099',
            'month' => 'nullable|integer|min:1|max:12',
        ]);

        $year  = $request->integer('year',  now()->year);
        $month = $request->integer('month', now()->month);

        $start    = Carbon::create($year, $month, 1)->startOfMonth();
        $end      = $start->copy()->endOfMonth();
        $prevStart = $start->copy()->subMonth()->startOfMonth();
        $prevEnd   = $prevStart->copy()->endOfMonth();

        $staff = User::where('role', UserRole::STAFF)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // ── Scorecards for selected month ─────────────────────────────────
        $scorecards = $staff->map(function ($user) use ($start, $end, $prevStart, $prevEnd) {
            $tasks = Task::where('assigned_to', $user->id)
                ->where(function ($q) use ($start, $end) {
                    $q->whereBetween('due_date', [$start, $end])
                      ->orWhereBetween('created_at', [$start, $end]);
                })
                ->get();

            $total     = $tasks->count();
            $completed = $tasks->where('status', TaskStatus::COMPLETED)->count();

            $late = $tasks->filter(function ($t) {
                return $t->status === TaskStatus::COMPLETED
                    && $t->completed_at
                    && $t->due_date
                    && $t->completed_at->startOfDay()->gt($t->due_date->copy()->endOfDay());
            })->count();

            $overdue = $tasks->filter(fn($t) => $t->is_overdue)->count();
            $rate    = $total > 0 ? round(($completed / $total) * 100) : 0;

            // Previous month for trend comparison
            $prevTasks     = Task::where('assigned_to', $user->id)
                ->where(function ($q) use ($prevStart, $prevEnd) {
                    $q->whereBetween('due_date', [$prevStart, $prevEnd])
                      ->orWhereBetween('created_at', [$prevStart, $prevEnd]);
                })
                ->get();
            $prevTotal     = $prevTasks->count();
            $prevCompleted = $prevTasks->where('status', TaskStatus::COMPLETED)->count();
            $prevRate      = $prevTotal > 0 ? round(($prevCompleted / $prevTotal) * 100) : 0;
            $trend         = ($total > 0 || $prevTotal > 0) ? ($rate - $prevRate) : null;

            return [
                'id'         => $user->id,
                'name'       => $user->name,
                'position'   => $user->position,
                'avatar_url' => $user->avatar_url,
                'total'      => $total,
                'completed'  => $completed,
                'late'       => $late,
                'overdue'    => $overdue,
                'rate'       => $rate,
                'trend'      => $trend,
            ];
        })->values();

        // ── Monthly trends (last 6 months up to and including selected) ───
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $mStart = $start->copy()->subMonths($i)->startOfMonth();
            $mEnd   = $mStart->copy()->endOfMonth();

            $staffRates = $staff->map(function ($user) use ($mStart, $mEnd) {
                $tasks     = Task::where('assigned_to', $user->id)
                    ->where(function ($q) use ($mStart, $mEnd) {
                        $q->whereBetween('due_date', [$mStart, $mEnd])
                          ->orWhereBetween('created_at', [$mStart, $mEnd]);
                    })
                    ->get();
                $total     = $tasks->count();
                $completed = $tasks->where('status', TaskStatus::COMPLETED)->count();

                return [
                    'id'        => $user->id,
                    'rate'      => $total > 0 ? round(($completed / $total) * 100) : null,
                    'total'     => $total,
                    'completed' => $completed,
                ];
            })->keyBy('id');

            $monthlyTrends[] = [
                'label' => $mStart->format('M Y'),
                'month' => $mStart->month,
                'year'  => $mStart->year,
                'staff' => $staffRates,
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'period'         => $start->format('M Y'),
                'year'           => $year,
                'month'          => $month,
                'scorecards'     => $scorecards,
                'monthly_trends' => $monthlyTrends,
                'staff_list'     => $staff->map(fn($u) => [
                    'id'         => $u->id,
                    'name'       => $u->name,
                    'avatar_url' => $u->avatar_url,
                ]),
            ],
        ]);
    }
}
