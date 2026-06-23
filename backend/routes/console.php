<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-assign SOP tasks to all staff every day at 00:00 AM (Asia/Phnom_Penh, UTC+7)
Schedule::command('tasks:seed-daily')->dailyAt('00:00');
