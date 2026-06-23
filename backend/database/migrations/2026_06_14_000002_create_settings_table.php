<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // Seed default values
        $defaults = [
            // Store
            ['key' => 'store.name',                    'value' => 'Lucky Superstore',        'group' => 'store'],
            ['key' => 'store.branch',                  'value' => 'Main Branch',             'group' => 'store'],
            ['key' => 'store.address',                 'value' => '',                        'group' => 'store'],
            ['key' => 'store.operating_hours_open',    'value' => '07:00',                   'group' => 'store'],
            ['key' => 'store.operating_hours_close',   'value' => '22:00',                   'group' => 'store'],
            // Shifts
            ['key' => 'shift.morning_start',           'value' => '06:00',                   'group' => 'shift'],
            ['key' => 'shift.morning_end',             'value' => '14:00',                   'group' => 'shift'],
            ['key' => 'shift.afternoon_start',         'value' => '14:00',                   'group' => 'shift'],
            ['key' => 'shift.afternoon_end',           'value' => '22:00',                   'group' => 'shift'],
            ['key' => 'shift.night_start',             'value' => '22:00',                   'group' => 'shift'],
            ['key' => 'shift.night_end',               'value' => '06:00',                   'group' => 'shift'],
            // Notifications
            ['key' => 'notifications.task_assigned',   'value' => '1',                       'group' => 'notifications'],
            ['key' => 'notifications.task_overdue',    'value' => '1',                       'group' => 'notifications'],
            ['key' => 'notifications.daily_summary',   'value' => '0',                       'group' => 'notifications'],
            // Tasks
            ['key' => 'tasks.auto_assign_enabled',     'value' => '1',                       'group' => 'tasks'],
            ['key' => 'tasks.default_priority',        'value' => 'medium',                  'group' => 'tasks'],
            ['key' => 'tasks.sod_time',                'value' => '08:00',                   'group' => 'tasks'],
            ['key' => 'tasks.eod_time',                'value' => '20:00',                   'group' => 'tasks'],
            // Inventory
            ['key' => 'inventory.expiry_alert_days',   'value' => '3',                       'group' => 'inventory'],
            ['key' => 'inventory.stocktake_frequency', 'value' => 'weekly',                  'group' => 'inventory'],
            ['key' => 'inventory.fefo_enabled',        'value' => '1',                       'group' => 'inventory'],
            ['key' => 'inventory.min_stock_alert',     'value' => '1',                       'group' => 'inventory'],
            // System
            ['key' => 'system.app_version',            'value' => '1.0.0',                   'group' => 'system'],
            ['key' => 'system.support_email',          'value' => 'support@luckystore.com',  'group' => 'system'],
        ];

        $now = now();
        foreach ($defaults as &$row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }

        DB::table('settings')->insert($defaults);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
