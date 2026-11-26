<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ViewerAssistanceVerificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', 'account.active'])->group(function () {
        // These routes must remain reachable while a user is completing first-login setup.
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/password', [AuthController::class, 'changePassword']);

        // All application data and administration APIs require a completed password change.
        Route::middleware('password.changed')->group(function () {
            Route::post('/viewer/assistance-verification', ViewerAssistanceVerificationController::class)
                ->middleware(['role:Viewer', 'throttle:viewer-assistance-verification']);
            Route::get('/lookups', [LookupController::class, 'index'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::get('/budget/monthly', [BudgetController::class, 'show'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::put('/budget/monthly', [BudgetController::class, 'set'])
                ->middleware('role:Administrator');
            Route::post('/transactions/{transaction}/issue-guarantee-letter', [BudgetController::class, 'issueGuaranteeLetter'])
                ->middleware('role:Senior staff,Administrator');
            Route::get('/beneficiaries/history', [TransactionController::class, 'beneficiaryHistory'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::get('/beneficiaries/eligibility', [TransactionController::class, 'checkBeneficiaryEligibility'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::get('/transactions', [TransactionController::class, 'index'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::get('/transactions/search', [TransactionController::class, 'search'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::post('/transactions', [TransactionController::class, 'store'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::put('/transactions/{transaction}', [TransactionController::class, 'update'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])
                ->middleware('role:Administrator');

            Route::get('/drafts', [TransactionController::class, 'drafts'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::post('/drafts', [TransactionController::class, 'saveDraft'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::get('/drafts/{draft}', [TransactionController::class, 'showDraft'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::put('/drafts/{draft}', [TransactionController::class, 'updateDraft'])
                ->middleware('role:Staff,Senior staff,Administrator');
            Route::delete('/drafts/{draft}', [TransactionController::class, 'deleteDraft'])
                ->middleware('role:Staff,Senior staff,Administrator');

            Route::get('/reports/monthly', [ReportController::class, 'monthly'])
                ->middleware('role:Senior staff,Administrator');

            Route::middleware('role:Administrator')->prefix('admin')->group(function () {
                Route::get('/users', [AdminController::class, 'users']);
                Route::post('/users', [AdminController::class, 'createUser']);
                Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
                Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
                Route::get('/agencies', [AdminController::class, 'agencies']);
                Route::post('/agencies', [AdminController::class, 'createAgency']);
                Route::patch('/agencies/{agency}', [AdminController::class, 'updateAgency']);
                Route::delete('/agencies/{agency}', [AdminController::class, 'deleteAgency']);
                Route::post('/barangays', [AdminController::class, 'createBarangay']);
                Route::delete('/barangays/{barangay}', [AdminController::class, 'deleteBarangay']);
                Route::post('/assistance-types', [AdminController::class, 'createAssistanceType']);
                Route::patch('/assistance-types/{assistanceType}', [AdminController::class, 'updateAssistanceType']);
                Route::put('/signatories/{signatory}', [AdminController::class, 'updateSignatory']);
                Route::put('/settings', [AdminController::class, 'updateSettings']);
            });
        });
    });
});
