<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        $default = $app['config']->get('database.default');
        $database = $app['config']->get('database.connections.mysql.database');
        $host = $app['config']->get('database.connections.mysql.host');
        $port = (string) $app['config']->get('database.connections.mysql.port');
        $username = $app['config']->get('database.connections.mysql.username');

        if (
            $default !== 'mysql'
            || $database !== 'aics_records_test'
            || $host !== '127.0.0.1'
            || $port !== '3306'
            || $username !== 'aics_test'
        ) {
            throw new RuntimeException(
                'Refusing to run tests: expected mysql aics_test@127.0.0.1:3306 on aics_records_test.'
            );
        }

        return $app;
    }
}
