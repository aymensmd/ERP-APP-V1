<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'manager_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('manager_id')->nullable()->after('department_id')
                    ->constrained('users')->onDelete('set null');
                $table->index('manager_id');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('users', 'manager_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['manager_id']);
                $table->dropColumn('manager_id');
            });
        }
    }
};




