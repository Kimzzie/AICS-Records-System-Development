<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('aics:health', function () {
    $this->info('AICS Laravel backend is ready.');
})->purpose('Check AICS backend availability');

Schedule::command('model:prune')->daily()->withoutOverlapping();
