<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('company_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('department_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', ['active', 'inactive', 'pending', 'suspended'])->default('active');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->json('permissions')->nullable(); // Custom permissions override
            $table->timestamps();

            $table->unique(['company_id', 'user_id']);
            $table->index('company_id');
            $table->index('user_id');
            $table->index('role_id');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('company_user');
    }
};




