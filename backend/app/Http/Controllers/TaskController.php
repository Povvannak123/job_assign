<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['assignedUser:id,name,email', 'creator:id,name', 'comments.user:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('due_date_from')) {
            $query->whereDate('due_date', '>=', $request->due_date_from);
        }

        if ($request->filled('due_date_to')) {
            $query->whereDate('due_date', '<=', $request->due_date_to);
        }

        if ($request->filled('search')) {
            $query->where('title', 'ilike', '%' . $request->search . '%');
        }

        $sortField = in_array($request->sort_by, ['due_date', 'created_at', 'priority'])
            ? $request->sort_by : 'created_at';
        $sortOrder = $request->sort_order === 'asc' ? 'asc' : 'desc';

        $tasks = $query->orderBy($sortField, $sortOrder)->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $tasks->items(),
            'meta'    => [
                'total'        => $tasks->total(),
                'per_page'     => $tasks->perPage(),
                'current_page' => $tasks->currentPage(),
                'last_page'    => $tasks->lastPage(),
            ],
        ]);
    }

    public function store(StoreTaskRequest $request)
    {
        $task = DB::transaction(function () use ($request) {
            return Task::create([
                'title'       => $request->title,
                'description' => $request->description,
                'assigned_to' => $request->assigned_to,
                'created_by'  => $request->user()->id,
                'status'      => $request->status ?? TaskStatus::NOT_STARTED->value,
                'priority'    => $request->priority ?? 'medium',
                'due_date'    => $request->due_date,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully.',
            'data'    => $task->load(['assignedUser:id,name', 'creator:id,name']),
        ], 201);
    }

    public function show($id)
    {
        $task = Task::with(['assignedUser:id,name,email', 'creator:id,name', 'comments.user:id,name'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $task,
        ]);
    }

    public function update(UpdateTaskRequest $request, $id)
    {
        $task = Task::findOrFail($id);

        DB::transaction(function () use ($request, $task) {
            $data = $request->only(['title', 'description', 'assigned_to', 'status', 'priority', 'due_date']);

            if (isset($data['status']) && $data['status'] === TaskStatus::COMPLETED->value
                && $task->status !== TaskStatus::COMPLETED) {
                $data['completed_at'] = now();
            } elseif (isset($data['status']) && $data['status'] !== TaskStatus::COMPLETED->value) {
                $data['completed_at'] = null;
            }

            $task->update($data);
        });

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully.',
            'data'    => $task->fresh()->load(['assignedUser:id,name', 'creator:id,name']),
        ]);
    }

    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully.',
        ]);
    }
}
