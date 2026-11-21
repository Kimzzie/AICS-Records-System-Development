<?php

use Illuminate\Support\Facades\Route;

Route::get('/',fn() => response()->json(['name' => config('app.name'),'status' => 'Laravel backend is running','api' => '/api/v1']));
