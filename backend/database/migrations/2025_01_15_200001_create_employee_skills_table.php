<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employee_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('skill_name');
            $table->string('category')->nullable(); // technical, soft, language, etc.
            $table->enum('proficiency', ['beginner', 'intermediate', 'advanced', 'expert'])->default('intermediate');
            $table->integer('years_of_experience')->nullable();
            $table->date('acquired_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'user_id']);
            $table->index('category');
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_skills');
    }
};




