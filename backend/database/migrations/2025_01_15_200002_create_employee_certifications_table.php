<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employee_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('issuing_organization');
            $table->string('certificate_number')->nullable();
            $table->date('issue_date');
            $table->date('expiry_date')->nullable();
            $table->string('credential_url')->nullable();
            $table->string('file_path')->nullable();
            $table->text('description')->nullable();
            $table->boolean('does_not_expire')->default(false);
            $table->timestamps();

            $table->index(['company_id', 'user_id']);
            $table->index('expiry_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_certifications');
    }
};




