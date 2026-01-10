<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                // Employee-specific fields
                $table->string('employee_id')->nullable()->unique()->after('id'); // Employee ID/Number
                $table->string('position')->nullable()->after('manager_id'); // Job title/position
                $table->date('hire_date')->nullable()->after('date_of_birth'); // Date of hire
                $table->decimal('salary', 10, 2)->nullable()->after('position'); // Salary
                $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'intern', 'freelance'])->default('full-time')->after('salary');
                $table->enum('status', ['active', 'inactive', 'on-leave', 'terminated'])->default('active')->after('employment_type');
                $table->text('notes')->nullable()->after('status'); // Additional notes
                $table->string('emergency_contact_name')->nullable()->after('sos_number');
                $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
                $table->string('emergency_contact_relation')->nullable()->after('emergency_contact_phone');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn([
                    'employee_id',
                    'position',
                    'hire_date',
                    'salary',
                    'employment_type',
                    'status',
                    'notes',
                    'emergency_contact_name',
                    'emergency_contact_phone',
                    'emergency_contact_relation',
                ]);
            });
        }
    }
};
