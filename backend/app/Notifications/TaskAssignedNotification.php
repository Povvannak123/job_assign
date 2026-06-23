<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification
{
    public function __construct(
        public readonly int    $taskId,
        public readonly string $taskTitle,
        public readonly string $dueDate,
        public readonly string $assignedBy,
        public readonly ?string $comment = null,
        public readonly ?string $photoUrl = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toArray($notifiable): array
    {
        return [
            'task_id'     => $this->taskId,
            'task_title'  => $this->taskTitle,
            'due_date'    => $this->dueDate,
            'assigned_by' => $this->assignedBy,
            'comment'     => $this->comment,
            'photo_url'   => $this->photoUrl,
            'message'     => "You have been assigned a new task: \"{$this->taskTitle}\"",
        ];
    }
}
