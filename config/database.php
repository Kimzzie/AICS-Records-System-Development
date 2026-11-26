<?php

$isTesting = env('APP_ENV') === 'testing';

return [
    'default' => env('DB_CONNECTION', 'mysql'),
    'connections' => [
        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => true,
        ],
        'mysql' => [
            'driver' => 'mysql',
            'url' => $isTesting ? null : env('DB_URL'),
            'host' => $isTesting ? env('DB_TEST_HOST', '127.0.0.1') : env('DB_HOST', '127.0.0.1'),
            'port' => $isTesting ? env('DB_TEST_PORT', '3306') : env('DB_PORT', '3306'),
            'database' => $isTesting ? env('DB_TEST_DATABASE', '') : env('DB_DATABASE', 'aics'),
            'username' => $isTesting ? env('DB_TEST_USERNAME', '') : env('DB_USERNAME', 'root'),
            'password' => $isTesting ? env('DB_TEST_PASSWORD', '') : env('DB_PASSWORD', ''),
            'unix_socket' => $isTesting ? '' : env('DB_SOCKET', ''),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql')
                ? array_filter([PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA')])
                : [],
        ],
    ],
    'migrations' => ['table' => 'migrations', 'update_date_on_publish' => true],
];
