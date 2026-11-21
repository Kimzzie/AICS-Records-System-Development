<?php

use App\\Http\\Controllers\\Api\\AdminController;
use App\\Http\\Controllers\\Api\\AuthController;
use App\\Http\\Controllers\\Api\\LookupController;
use App\\Http\\Controllers\\Api\\ReportController;
use App\\Http\\Controllers\\Api\\TransactionController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/password', [AuthController::class, 'changePassword']);

        Route::get('/lookups', [LookupController::class, 'index']);
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::get('/transactions/search', [TransactionController::class, 'search']);
        Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
        Route::post('/transactions', [TransactionController::class, 'store'])->middleware('role:Staff,Senior staff,Administrator');
        Route::put('/transactions/{transaction}', [TransactionController::class, 'update'])->middleware('role:Staff,Senior staff,Administrator');
        Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->middleware('role:Administrator');

        Route::get('/drafts', [TransactionController::class, 'drafts']);
        Route::post('/drafts', [TransactionController::class, 'saveDraft']);
        Route::delete('/drafts/{draft}', [TransactionController::class, 'deleteDraft']);

        Route::get('/reports/monthly', [ReportController::class, 'monthly'])->middleware('role:Senior staff,Administrator');

        Route::middleware('role:Administrator')->prefix('admin')->group(function () {
            Route::get('/users', [AdminController::class, 'users']);
            Route::post('/users', [AdminController::class, 'createUser']);
            Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
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
