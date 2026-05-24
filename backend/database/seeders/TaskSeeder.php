<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        if (Task::count() > 0) {
            return;
        }

        $admin = User::where('email', 'admin@jobassign.com')->first();
        $staff = User::where('role', 'staff')->get();

        if (!$admin || $staff->isEmpty()) {
            return;
        }

        $tasks = [
            [
                'title'        => 'Open Store',
                'description'  => 'Unlock the main entrance, turn on lights, and prepare the store by 8AM.',
                'priority'     => 'high',
                'status'       => 'completed',
                'due_date'     => now()->subDays(1)->toDateString(),
                'completed_at' => now()->subDays(1),
            ],
            [
                'title'       => 'Receive Goods',
                'description' => 'Check and receive incoming deliveries from suppliers. Verify quantities and condition.',
                'priority'    => 'high',
                'status'      => 'in_progress',
                'due_date'    => now()->toDateString(),
            ],
            [
                'title'       => 'Refill Stock',
                'description' => 'Restock shelves with items from the stockroom. Prioritize fast-moving products.',
                'priority'    => 'medium',
                'status'      => 'not_started',
                'due_date'    => now()->addDays(1)->toDateString(),
            ],
            [
                'title'       => 'Do Price Tag',
                'description' => 'Update product price labels according to the new price list sent by management.',
                'priority'    => 'medium',
                'status'      => 'not_started',
                'due_date'    => now()->addDays(2)->toDateString(),
            ],
            [
                'title'       => 'Face Up Goods',
                'description' => 'Arrange all products to face the front of shelves. Ensure neat presentation.',
                'priority'    => 'low',
                'status'      => 'not_started',
                'due_date'    => now()->addDays(1)->toDateString(),
            ],
            [
                'title'       => 'Expiry Check',
                'description' => 'Check all product expiry dates. Remove expired items and flag near-expiry products.',
                'priority'    => 'high',
                'status'      => 'in_progress',
                'due_date'    => now()->toDateString(),
            ],
            [
                'title'       => 'Clean Store Floor',
                'description' => 'Sweep and mop all floor sections. Clean entrance mats.',
                'priority'    => 'low',
                'status'      => 'not_started',
                'due_date'    => now()->addDays(1)->toDateString(),
            ],
            [
                'title'       => 'Close Store',
                'description' => 'Lock all entrances, turn off non-essential equipment, and complete end-of-day cash count.',
                'priority'    => 'high',
                'status'      => 'not_started',
                'due_date'    => now()->toDateString(),
            ],
            [
                'title'       => 'Weekly Inventory Count',
                'description' => 'Perform weekly stock count and update inventory system.',
                'priority'    => 'medium',
                'status'      => 'not_started',
                'due_date'    => now()->addDays(3)->toDateString(),
            ],
            [
                'title'       => 'Customer Service Training',
                'description' => 'Attend mandatory customer service refresher training session.',
                'priority'    => 'medium',
                'status'      => 'not_started',
                'due_date'    => now()->subDays(2)->toDateString(),
            ],
        ];

        foreach ($tasks as $index => $taskData) {
            $assignedUser = $staff[$index % $staff->count()];

            Task::create(array_merge($taskData, [
                'assigned_to' => $assignedUser->id,
                'created_by'  => $admin->id,
            ]));
        }
    }
}
