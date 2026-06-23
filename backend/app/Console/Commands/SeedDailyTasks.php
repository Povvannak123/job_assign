<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Models\TaskTemplateItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SeedDailyTasks extends Command
{
    protected $signature   = 'tasks:seed-daily {--date= : Target date (Y-m-d), defaults to today}';
    protected $description = 'Auto-assign SOP tasks to all staff for the given date (reads templates from DB)';

    public function handle(): int
    {
        $date    = $this->option('date') ? Carbon::parse($this->option('date')) : Carbon::today();
        $dateStr = $date->toDateString();

        $admin   = User::where('role', 'admin')->firstOrFail();
        $created = 0;

        // Load all template items grouped by staff_id
        // ALL categories (daily, weekly, monthly, quarterly) are seeded every day
        // so the board always shows the full picture for every staff member.
        $allItems = TaskTemplateItem::orderBy('sort_order')
            ->get()
            ->groupBy('staff_id');

        foreach ($allItems as $staffId => $items) {
            $staff = User::find($staffId);
            if (!$staff) continue;

            foreach ($items as $item) {
                $cat      = $item->category;
                $catLabel = ucfirst($cat); // Daily, Weekly, Monthly, Quarterly

                // Prefix title so the frontend can group tasks into tabs by category
                $titleWithNum = '[' . $catLabel . '] ' . ($item->sort_order + 1) . '. ' . $item->title;

                // Duplicate prevention — skip if this exact task already exists for this date
                $exists = Task::where('assigned_to', $staffId)
                    ->where('due_date', $dateStr)
                    ->where('title', $titleWithNum)
                    ->exists();

                if ($exists) continue;

                Task::create([
                    'title'       => $titleWithNum,
                    'description' => '[' . $catLabel . '] ' . $staff->name . ' SOP',
                    'assigned_to' => $staffId,
                    'created_by'  => $admin->id,
                    'status'      => 'not_started',
                    'priority'    => 'medium',
                    'due_date'    => $dateStr,
                ]);
                $created++;
            }
        }

        $this->info("Created {$created} tasks for {$dateStr}.");
        return Command::SUCCESS;
    }
}
