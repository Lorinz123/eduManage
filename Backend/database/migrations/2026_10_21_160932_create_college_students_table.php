<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('college_students', function (Blueprint $table) {
            $table->id();

            $table->string('student_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable()->unique();

            $table->string('program');
            $table->string('department');
            $table->unsignedTinyInteger('year_level');
            $table->string('section')->nullable();

            $table->enum('enrollment_status', [
                'active',
                'inactive',
                'transferred',
                'archived',
            ])->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('college_students');
    }
};
