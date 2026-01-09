<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('kanban_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('board_id')->constrained('kanban_boards')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status'); // Column name (e.g., 'todo', 'in_progress', 'done')
            $table->integer('position')->default(0); // Order within column
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->date('due_date')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->json('tags')->nullable();
            $table->integer('estimated_hours')->nullable();
            $table->integer('actual_hours')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'board_id', 'status']);
            $table->index(['company_id', 'assigned_to']);
            $table->index('due_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('kanban_tasks');
    }
};




