<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    private function defaults(): array
    {
        return [
            'email_notifications' => true,
            'attendance_reminders' => true,
            'enrollment_alerts' => true,
            'theme' => 'light',
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $settings = DB::table('user_settings')
            ->where('user_id', $request->user()->id)
            ->first();

        $preferences = $settings
            ? array_merge(
                $this->defaults(),
                json_decode($settings->preferences, true) ?? []
            )
            : $this->defaults();

        return response()->json([
            'data' => $preferences,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_notifications' => ['required', 'boolean'],
            'attendance_reminders' => ['required', 'boolean'],
            'enrollment_alerts' => ['required', 'boolean'],
            'theme' => [
                'required',
                Rule::in(['light', 'dark', 'system']),
            ],
        ]);

        $userId = $request->user()->id;

        DB::table('user_settings')->updateOrInsert(
            ['user_id' => $userId],
            [
                'preferences' => json_encode($validated),
                'updated_at' => now(),
                'created_at' => DB::raw(
                    'COALESCE(created_at, CURRENT_TIMESTAMP)'
                ),
            ]
        );

        return response()->json([
            'message' => 'Settings saved successfully.',
            'data' => $validated,
        ]);
    }
}