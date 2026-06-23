<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

        $sortField = in_array($request->sort_by, ['due_date', 'created_at', 'priority', 'title'])
            ? $request->sort_by : 'created_at';
        $sortOrder = $request->sort_order === 'asc' ? 'asc' : 'desc';

        $perPage = min((int) ($request->per_page ?? 15), 1000);

        // When fetching board tasks (filtered by due_date), sort by assigned_to then title
        // so the numeric prefix "N." puts tasks in the correct order per staff member.
        if ($request->filled('due_date_from') || $request->filled('due_date_to')) {
            $tasks = $query
                ->orderBy('assigned_to')
                ->orderBy('title')
                ->paginate($perPage);
        } else {
            $tasks = $query->orderBy($sortField, $sortOrder)->paginate($perPage);
        }

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

        // Attach comment / photo if provided and send notification to assigned staff
        $photoPath = null;
        if ($request->hasFile('photo_proof')) {
            $file      = $request->file('photo_proof');
            $safe      = preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
            $filename  = time() . '_' . $safe;
            $photoPath = $file->storeAs('task-proofs', $filename, 'public');
        }

        if ($request->filled('comment') || $photoPath) {
            TaskComment::create([
                'task_id'     => $task->id,
                'user_id'     => $request->user()->id,
                'comment'     => $request->comment,
                'photo_proof' => $photoPath,
            ]);
        }

        if ($task->assigned_to) {
            $staff = User::find($task->assigned_to);
            if ($staff) {
                $staff->notify(new TaskAssignedNotification(
                    taskId:     $task->id,
                    taskTitle:  $task->title,
                    dueDate:    $task->due_date?->toDateString() ?? '',
                    assignedBy: $request->user()->name,
                    comment:    $request->comment,
                    photoUrl:   $photoPath ? Storage::url($photoPath) : null,
                ));
            }
        }

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

    /**
     * POST /tasks/assign-daily
     * Runs the tasks:seed-daily Artisan command for a given date (defaults to today).
     * Returns how many tasks were created so the frontend can decide whether to refresh.
     */
    public function assignDaily(Request $request)
    {
        $date = $request->input('date', now()->toDateString());

        // Validate date format
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['success' => false, 'message' => 'Invalid date format.'], 422);
        }

        Artisan::call('tasks:seed-daily', ['--date' => $date]);
        $output = trim(Artisan::output());

        // Parse created count from output e.g. "Created 42 tasks for 2026-06-13."
        preg_match('/Created (\d+) tasks/', $output, $m);
        $created = isset($m[1]) ? (int) $m[1] : 0;

        return response()->json([
            'success' => true,
            'message' => $output ?: "Tasks assigned for {$date}.",
            'created' => $created,
            'date'    => $date,
        ]);
    }
}
