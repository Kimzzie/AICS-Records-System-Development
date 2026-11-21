<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('aics_monthly_budgets', function (Blueprint $table) {
            $table->id();
            $table->char('budget_month', 7)->unique();
            $table->decimal('total_budget', 14, 2);
            $table->foreignId('set_by')->constrained('users');
            $table->timestamps();
        });

        Schema::table('aics_transactions', function (Blueprint $table) {
            $table->timestamp('guarantee_letter_issued_at')->nullable()->after('status');
            $table->decimal('guaranteed_amount', 14, 2)->nullable()->after('guarantee_letter_issued_at');
        });
    }

    public function down(): void
    {
        Schema::table('aics_transactions', function (Blueprint $table) {
            $table->dropColumn(['guarantee_letter_issued_at', 'guaranteed_amount']);
        });
        Schema::dropIfExists('aics_monthly_budgets');
    }
};
