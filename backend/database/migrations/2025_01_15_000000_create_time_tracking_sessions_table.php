<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('time_tracking_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'start_time']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('time_tracking_sessions');
    }
};




