<?php

namespace App\Enums;

enum TaskPriority: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';

    public function label(): string
    {
        return match($this) {
            TaskPriority::LOW => 'Low',
            TaskPriority::MEDIUM => 'Medium',
            TaskPriority::HIGH => 'High',
        };
    }
}
