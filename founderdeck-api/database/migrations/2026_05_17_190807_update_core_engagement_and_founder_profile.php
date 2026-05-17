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
        // Add profile detail columns to users table
        Schema::table('users', function (Blueprint $table) {
            $table->text('skills')->nullable(); // Cast to array in model
            $table->text('linkedin_credentials')->nullable(); // Cast to array in model
            $table->integer('mutual_connections_count')->default(0);
            $table->boolean('is_linkedin_verified')->default(false);
            $table->boolean('is_angellist_verified')->default(false);
            $table->boolean('is_crunchbase_verified')->default(false);
            $table->integer('scorecard_wins')->default(0);
            $table->integer('scorecard_exits')->default(0);
            $table->integer('scorecard_collabs')->default(0);
        });

        // Add vote weight to votes table
        Schema::table('votes', function (Blueprint $table) {
            $table->integer('weight')->default(1);
        });

        // Create bookmarks table
        Schema::create('bookmarks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookmarks');

        Schema::table('votes', function (Blueprint $table) {
            $table->dropColumn('weight');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'skills',
                'linkedin_credentials',
                'mutual_connections_count',
                'is_linkedin_verified',
                'is_angellist_verified',
                'is_crunchbase_verified',
                'scorecard_wins',
                'scorecard_exits',
                'scorecard_collabs',
            ]);
        });
    }
};

