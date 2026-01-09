<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type'); // contract, certificate, id_card, resume, etc.
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_confidential')->default(false);
            $table->timestamps();

            $table->index(['company_id', 'user_id']);
            $table->index('type');
            $table->index('expiry_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_documents');
    }
};




