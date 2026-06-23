<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 10)->nullable()->after('position');
            }
            if (!Schema::hasColumn('users', 'location_row')) {
                $table->string('location_row', 100)->nullable()->after('phone_number');
            }
            if (!Schema::hasColumn('users', 'day_off')) {
                $table->string('day_off', 20)->nullable()->after('location_row');
            }
            if (!Schema::hasColumn('users', 'store_name')) {
                $table->string('store_name', 50)->nullable()->after('day_off');
            }
            if (!Schema::hasColumn('users', 'shift')) {
                $table->string('shift', 30)->nullable()->after('store_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['phone_number', 'location_row', 'day_off', 'store_name', 'shift'];
            $existing = array_filter($columns, fn($col) => Schema::hasColumn('users', $col));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
