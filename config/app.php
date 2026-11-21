<?php

return [
    'name' => env('APP_NAME', 'AICS Records'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => 'Asia/Manila',
    'locale' => 'en',
    'fallback_locale' => 'en',
    'faker_locale' => 'en_PH',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
    'previous_keys' => array_filter(explode(',', (string) env('APP_PREVIOUS_KEYS', ''))),
    'maintenance' => ['driver' => env('APP_MAINTENANCE_DRIVER', 'file'), 'store' => env('APP_MAINTENANCE_STORE', 'database')],
    'providers' => Illuminate\\Support\\ServiceProvider::defaultProviders()->merge([
        App\\Providers\\AppServiceProvider::class,
    ])->toArray(),
];
