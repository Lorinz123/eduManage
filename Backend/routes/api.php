<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CollegeStudentController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public teacher authentication endpoints.
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Only authenticated teachers can access these endpoints.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile/password', [AuthController::class, 'changePassword'])
        ->middleware('throttle:5,1');

    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);

   Route::apiResource('students', CollegeStudentController::class);

    Route::patch('/students/{id}/archive', [
        CollegeStudentController::class,
        'archive',
    ])->whereNumber('id');
});
