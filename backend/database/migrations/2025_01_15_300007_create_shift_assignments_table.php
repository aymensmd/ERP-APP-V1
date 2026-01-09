<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('shift_id')->constrained()->onDelete('cascade');
            $table->date('assignment_date');
            $table->time('start_time')->nullable(); // Override shift default
            $table->time('end_time')->nullable(); // Override shift default
            $table->enum('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['company_id', 'user_id', 'assignment_date']);
            $table->index(['company_id', 'shift_id', 'assignment_date']);
            $table->index('assignment_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('shift_assignments');
    }
};



