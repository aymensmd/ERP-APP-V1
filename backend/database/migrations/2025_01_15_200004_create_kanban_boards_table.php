<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('kanban_boards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('project_id')->nullable()->constrained('events')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->json('settings')->nullable(); // Column configuration, etc.
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index(['company_id', 'project_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('kanban_boards');
    }
};




