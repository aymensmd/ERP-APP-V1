<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Add supports_scope column to permissions table
        if (Schema::hasTable('permissions') && !Schema::hasColumn('permissions', 'supports_scope')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->boolean('supports_scope')->default(false)->after('group');
            });
        }

        // Create permission_scopes table for user-specific scope overrides
        Schema::create('permission_scopes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('permission_id')->constrained()->onDelete('cascade');
            $table->enum('scope', ['self', 'department', 'company'])->default('self');
            $table->text('notes')->nullable(); // Optional notes about why this scope was granted
            $table->timestamps();
            
            $table->unique(['user_id', 'company_id', 'permission_id'], 'user_company_permission_unique');
            $table->index(['user_id', 'company_id']);
            $table->index('permission_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Drop permission_scopes table
        Schema::dropIfExists('permission_scopes');

        // Remove supports_scope column from permissions
        if (Schema::hasColumn('permissions', 'supports_scope')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->dropColumn('supports_scope');
            });
        }
    }
};
