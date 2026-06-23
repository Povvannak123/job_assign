<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CommentController extends Controller
{
    public function store(Request $request, $taskId)
    {
        $request->validate([
            'comment'     => 'nullable|string',
            'photo_proof' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        ]);

        $task = Task::where('id', $taskId)
            ->where('assigned_to', $request->user()->id)
            ->firstOrFail();

        $photoPath = null;

        if ($request->hasFile('photo_proof')) {
            $file      = $request->file('photo_proof');
            $safe      = preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
            $filename  = time() . '_' . $safe;
            $photoPath = $file->storeAs('task-proofs', $filename, 'public');
        }

        if (!$request->filled('comment') && !$photoPath) {
            return response()->json([
                'success' => false,
                'message' => 'Comment text or photo proof is required.',
            ], 422);
        }

        $comment = TaskComment::create([
            'task_id'     => $task->id,
            'user_id'     => $request->user()->id,
            'comment'     => $request->comment,
            'photo_proof' => $photoPath,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully.',
            'data'    => [
                'id'              => $comment->id,
                'task_id'         => $comment->task_id,
                'user_id'         => $comment->user_id,
                'comment'         => $comment->comment,
                'photo_proof'     => $photoPath ? Storage::url($photoPath) : null,
                'created_at'      => $comment->created_at,
            ],
        ], 201);
    }
}
