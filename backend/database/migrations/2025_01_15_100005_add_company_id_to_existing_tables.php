<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add company_id to users table (users can belong to multiple companies via company_user)
        // Note: Keeping users table as is, using company_user pivot for multi-tenancy
        
        // Add company_id to departments
        if (Schema::hasTable('departments') && !Schema::hasColumn('departments', 'company_id')) {
            Schema::table('departments', function (Blueprint $table) {
                // Make nullable initially to allow migration of existing data
                $companyId = $table->foreignId('company_id')->nullable()->after('id');
                // Add constraint only after creating companies table
                if (Schema::hasTable('companies')) {
                    $companyId->constrained()->onDelete('cascade');
                }
                $table->index('company_id');
            });
        }

        // Add company_id to events
        if (Schema::hasTable('events') && !Schema::hasColumn('events', 'company_id')) {
            Schema::table('events', function (Blueprint $table) {
                $companyId = $table->foreignId('company_id')->nullable()->after('id');
                if (Schema::hasTable('companies')) {
                    $companyId->constrained()->onDelete('cascade');
                }
                $table->index('company_id');
            });
        }

        // Add company_id to vacations
        if (Schema::hasTable('vacations') && !Schema::hasColumn('vacations', 'company_id')) {
            Schema::table('vacations', function (Blueprint $table) {
                $companyId = $table->foreignId('company_id')->nullable()->after('id');
                if (Schema::hasTable('companies')) {
                    $companyId->constrained()->onDelete('cascade');
                }
                $table->index('company_id');
            });
        }

        // Add company_id to time_tracking_sessions
        if (Schema::hasTable('time_tracking_sessions') && !Schema::hasColumn('time_tracking_sessions', 'company_id')) {
            Schema::table('time_tracking_sessions', function (Blueprint $table) {
                $companyId = $table->foreignId('company_id')->nullable()->after('id');
                if (Schema::hasTable('companies')) {
                    $companyId->constrained()->onDelete('cascade');
                }
                $table->index('company_id');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('departments', 'company_id')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        if (Schema::hasColumn('events', 'company_id')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        if (Schema::hasColumn('vacations', 'company_id')) {
            Schema::table('vacations', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        if (Schema::hasColumn('time_tracking_sessions', 'company_id')) {
            Schema::table('time_tracking_sessions', function (Blueprint $table) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }
    }
};

