<?php
use Illuminate\Support\Facades\Artisan;
Artisan::command('aics:health',function(){ $this->info('AICS Laravel backend is ready.'); })->purpose('Check AICS backend availability');