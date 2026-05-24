<?php

namespace App\Enums;

enum TaskStatus: string
{
    case NOT_STARTED = 'not_started';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match($this) {
            TaskStatus::NOT_STARTED => 'Not Started',
            TaskStatus::IN_PROGRESS => 'In Progress',
            TaskStatus::COMPLETED => 'Completed',
        };
    }
}
