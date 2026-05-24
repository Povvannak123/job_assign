<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'status'      => 'nullable|in:not_started,in_progress,completed',
            'priority'    => 'nullable|in:low,medium,high',
            'due_date'    => 'nullable|date',
        ];
    }
}
