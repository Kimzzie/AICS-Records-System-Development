<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate(['username' => ['required','string'], 'password' => ['required','string'], 'device_name' => ['nullable','string','max:100']]);
        $user = User::where('username', $data['username'])->first();
        if (!$user || $user->status !== 'Active' || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['username' => ['Invalid credentials or disabled account.']]);
        }
        $user->update(['last_login_at' => now()]);
        return response()->json([
            'token' => $user->createToken($data['device_name'] ?? 'AICS Web')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->payload($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $this->payload($request->user())]);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required','current_password:api'],
            'password' => ['required','string','min:10','confirmed'],
        ]);
        $request->user()->update(['password' => $data['password'], 'must_change_password' => false]);
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Password changed. Please log in again.']);
    }

    private function payload(User $user): array
    {
        return $user->only(['id','name','username','role','status','must_change_password']);
    }
}
