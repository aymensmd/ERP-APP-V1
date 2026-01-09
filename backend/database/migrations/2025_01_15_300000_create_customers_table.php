<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('company_name')->nullable();
            $table->string('job_title')->nullable();
            $table->string('industry')->nullable();
            $table->enum('type', ['individual', 'business'])->default('individual');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('tax_id')->nullable();
            $table->text('billing_address')->nullable();
            $table->text('shipping_address')->nullable();
            $table->string('website')->nullable();
            $table->decimal('credit_limit', 15, 2)->nullable();
            $table->decimal('total_revenue', 15, 2)->default(0);
            $table->integer('total_orders')->default(0);
            $table->date('first_contact_date')->nullable();
            $table->date('last_contact_date')->nullable();
            $table->text('notes')->nullable();
            $table->json('custom_fields')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'type']);
            $table->index('email');
            $table->index('lead_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('customers');
    }
};



