<?php

use Illuminate\\Support\\Facades\\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'status' => 'Laravel backend is running',
        'api' => '/api',
    ]);
});
