<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'shift')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users ALTER COLUMN shift TYPE VARCHAR(30)');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE users MODIFY shift VARCHAR(30) NULL');
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('users', 'shift')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE users ALTER COLUMN shift TYPE VARCHAR(10)');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE users MODIFY shift VARCHAR(10) NULL');
        }
    }
};
