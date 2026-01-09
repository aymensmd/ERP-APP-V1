<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->morphs('communicable'); // Creates communicable_type and communicable_id
            $table->enum('type', ['call', 'email', 'meeting', 'note', 'sms', 'whatsapp', 'other'])->default('note');
            $table->string('subject')->nullable();
            $table->text('content');
            $table->enum('direction', ['inbound', 'outbound'])->default('outbound');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Who made/received
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('completed');
            $table->integer('duration_minutes')->nullable(); // For calls/meetings
            $table->json('attachments')->nullable();
            $table->json('metadata')->nullable(); // Additional data
            $table->timestamps();

            $table->index(['company_id', 'communicable_type', 'communicable_id'], 'comm_company_comm_idx');
            $table->index(['company_id', 'type'], 'comm_company_type_idx');
            $table->index(['company_id', 'user_id'], 'comm_company_user_idx');
            $table->index('scheduled_at', 'comm_scheduled_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('communications');
    }
};

