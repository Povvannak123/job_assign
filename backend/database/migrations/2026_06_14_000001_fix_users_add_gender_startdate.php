<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Fix phone_number from varchar(10) → varchar(20)
            if (Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 20)->nullable()->change();
            }

            // Add gender column
            if (!Schema::hasColumn('users', 'gender')) {
                $table->string('gender', 10)->nullable()->after('phone_number');
            }

            // Add start_date column
            if (!Schema::hasColumn('users', 'start_date')) {
                $table->date('start_date')->nullable()->after('gender');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 10)->nullable()->change();
            }
            if (Schema::hasColumn('users', 'gender')) {
                $table->dropColumn('gender');
            }
            if (Schema::hasColumn('users', 'start_date')) {
                $table->dropColumn('start_date');
            }
        });
    }
};
