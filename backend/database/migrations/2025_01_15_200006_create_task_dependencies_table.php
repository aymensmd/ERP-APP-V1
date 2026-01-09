<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('kanban_tasks')->onDelete('cascade');
            $table->foreignId('depends_on_task_id')->constrained('kanban_tasks')->onDelete('cascade');
            $table->enum('type', ['blocks', 'blocked_by', 'related'])->default('blocks');
            $table->timestamps();

            $table->unique(['task_id', 'depends_on_task_id']);
            $table->index('task_id');
            $table->index('depends_on_task_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('task_dependencies');
    }
};




