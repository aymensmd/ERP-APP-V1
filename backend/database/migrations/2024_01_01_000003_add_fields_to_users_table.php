<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable();
            $table->enum('genre', ['Male', 'Female'])->nullable();
            $table->string('address')->nullable();
            $table->string('phone_number', 20)->nullable();
            $table->string('sos_number', 20)->nullable();
            $table->string('social_situation')->nullable();
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['role_id']);
            $table->dropColumn([
                'date_of_birth',
                'genre',
                'address',
                'phone_number',
                'sos_number',
                'social_situation',
                'department_id',
                'role_id'
            ]);
        });
    }
};





