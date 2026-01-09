<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add indexes for frequently queried columns
            $table->index('department_id');
            $table->index('role_id');
            $table->index('email'); // Already unique, but explicit index for clarity
        });

        Schema::table('vacations', function (Blueprint $table) {
            // Add indexes for frequently queried columns
            $table->index('user_id');
            $table->index('status');
            $table->index(['user_id', 'status']); // Composite index for common query pattern
            $table->index('approved_by');
            $table->index('start_date');
            $table->index('end_date');
        });

        Schema::table('events', function (Blueprint $table) {
            // Add indexes for frequently queried columns
            $table->index('created_by');
            $table->index('start_date');
            $table->index('end_date');
        });

        Schema::table('event_participant', function (Blueprint $table) {
            // Add indexes for pivot table
            $table->index('user_id');
            $table->index('event_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['department_id']);
            $table->dropIndex(['role_id']);
            $table->dropIndex(['email']);
        });

        Schema::table('vacations', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['approved_by']);
            $table->dropIndex(['start_date']);
            $table->dropIndex(['end_date']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['created_by']);
            $table->dropIndex(['start_date']);
            $table->dropIndex(['end_date']);
        });

        Schema::table('event_participant', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['event_id']);
        });
    }
};
