<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'employees.create', 'employees.update'
            $table->string('resource'); // e.g., 'employees', 'departments'
            $table->string('action'); // e.g., 'create', 'update', 'delete', 'view'
            $table->string('description')->nullable();
            $table->string('group')->nullable(); // e.g., 'HRM', 'CRM', 'Finance'
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('resource');
            $table->index('action');
            $table->index(['resource', 'action']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('permissions');
    }
};




