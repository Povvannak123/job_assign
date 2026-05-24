<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffTaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['creator:id,name', 'comments.user:id,name'])
            ->where('assigned_to', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $tasks = $query->orderBy('due_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data'    => $tasks,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:in_progress,completed',
        ]);

        $task = Task::where('id', $id)
            ->where('assigned_to', $request->user()->id)
            ->firstOrFail();

        DB::transaction(function () use ($request, $task) {
            $data = ['status' => $request->status];

            if ($request->status === TaskStatus::COMPLETED->value) {
                $data['completed_at'] = now();
            }

            $task->update($data);
        });

        return response()->json([
            'success' => true,
            'message' => 'Task status updated.',
            'data'    => $task->fresh(),
        ]);
    }
}
