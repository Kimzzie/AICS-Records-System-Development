<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ViewerAssistanceVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ViewerAssistanceVerificationController extends Controller
{
    public function __invoke(
        Request $request,
        ViewerAssistanceVerificationService $service
    ): JsonResponse {
        if (!config('viewer-assistance.enabled')) {
            return response()->json([
                'message' => 'Assistance verification is temporarily unavailable.',
            ], 503)->header('Cache-Control', 'private, no-store');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'birthdate' => ['required', 'date_format:Y-m-d'],
        ]);

        $result = $service->verify(trim($validated['name']), $validated['birthdate']);

        Log::info('viewer_assistance_verification', [
            'viewer_id' => $request->user()->getAuthIdentifier(),
            'match_status' => $result['match_status'],
            'records_returned' => count($result['records']),
        ]);

        return response()->json([
            'data' => [
                'match_status' => $result['match_status'],
                'records' => $result['records'],
            ],
        ])->header('Cache-Control', 'private, no-store');
    }
}
