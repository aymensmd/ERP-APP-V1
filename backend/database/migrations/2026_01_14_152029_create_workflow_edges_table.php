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
    public function up(): void
    {
        Schema::create('workflow_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->onDelete('cascade');
            $table->uuid('source_node_id');
            $table->uuid('target_node_id');
            $table->string('label')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->foreign('source_node_id')->references('id')->on('workflow_nodes')->onDelete('cascade');
            $table->foreign('target_node_id')->references('id')->on('workflow_nodes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_edges');
    }
};
