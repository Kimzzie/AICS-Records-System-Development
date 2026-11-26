<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->status !== 'Active') {
            return response()->json([
                'message' => 'Your account is disabled. Contact an administrator.',
            ], 403);
        }

        return $next($request);
    }
}
