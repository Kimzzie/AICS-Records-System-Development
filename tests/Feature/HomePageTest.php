<?php

namespace Tests\Feature;

use Tests\TestCase;

class HomePageTest extends TestCase
{
    public function test_home_route_serves_the_frontend_entry_point(): void
    {
        $this->get('/')->assertOk()->assertHeader('content-type', 'text/html; charset=UTF-8');
    }
}
