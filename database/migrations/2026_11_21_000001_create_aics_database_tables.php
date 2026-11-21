<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('email')->nullable()->unique();
            $table->string('password');
            $table->string('role')->default('Staff');
            $table->string('status')->default('Active');
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('extension')->nullable();
            $table->string('full_name')->index();
            $table->string('street')->nullable();
            $table->string('barangay')->nullable()->index();
            $table->string('city')->default('Maramag');
            $table->string('province')->default('Bukidnon');
            $table->string('region')->default('10');
            $table->string('mobile')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('gender')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('occupation')->nullable();
            $table->decimal('monthly_salary', 12, 2)->default(0);
            $table->timestamps();
            $table->index(['last_name', 'first_name']);
        });

        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->id();
            $table->string('last_name');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('extension')->nullable();
            $table->string('full_name')->index();
            $table->string('street')->nullable();
            $table->string('barangay')->nullable()->index();
            $table->string('city')->default('Maramag');
            $table->string('province')->default('Bukidnon');
            $table->string('region')->default('10');
            $table->string('mobile')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('gender')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('occupation')->nullable();
            $table->decimal('monthly_salary', 12, 2)->default(0);
            $table->string('relationship_to_client')->nullable();
            $table->timestamps();
            $table->index(['last_name', 'first_name']);
        });

        Schema::create('partner_agencies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('address')->nullable();
            $table->string('contact')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('assistance_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('copies')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('assistance_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assistance_type_id')->constrained()->cascadeOnDelete();
            $table->string('requirement');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_required')->default(true);
            $table->timestamps();
        });

        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('signatories', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('role_label');
            $table->string('name');
            $table->string('title')->nullable();
            $table->timestamps();
        });

        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });

        Schema::create('aics_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('gl_number')->unique();
            $table->date('transaction_date')->index();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('beneficiary_id')->constrained()->restrictOnDelete();
            $table->string('client_type')->default('New');
            $table->string('source')->default('Walk-in');
            $table->string('target_sector')->nullable();
            $table->string('sub_category')->nullable();
            $table->foreignId('assistance_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('assistance_provided')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('amount_words')->nullable();
            $table->string('fund_source')->nullable();
            $table->string('purpose')->nullable();
            $table->foreignId('partner_agency_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contact_person')->nullable();
            $table->string('contact_number')->nullable();
            $table->date('valid_until')->nullable();
            $table->text('case_summary')->nullable();
            $table->string('worker_name')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('Saved');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'transaction_date']);
            $table->index(['beneficiary_id', 'transaction_date']);
            $table->index(['partner_agency_id', 'transaction_date']);
        });

        Schema::create('family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('aics_transactions')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('relationship')->nullable();
            $table->unsignedSmallInteger('age')->nullable();
            $table->string('civil_status')->nullable();
            $table->string('occupation')->nullable();
            $table->decimal('monthly_salary', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('transaction_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('client_name')->nullable();
            $table->string('beneficiary_name')->nullable();
            $table->string('assistance')->nullable();
            $table->json('form_data');
            $table->timestamp('last_saved_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'updated_at']);
        });

        Schema::create('transaction_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('aics_transactions')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->json('changes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_audit_logs');
        Schema::dropIfExists('transaction_drafts');
        Schema::dropIfExists('family_members');
        Schema::dropIfExists('aics_transactions');
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('signatories');
        Schema::dropIfExists('barangays');
        Schema::dropIfExists('assistance_requirements');
        Schema::dropIfExists('assistance_types');
        Schema::dropIfExists('partner_agencies');
        Schema::dropIfExists('beneficiaries');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
