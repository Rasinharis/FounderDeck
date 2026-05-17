<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\VoteController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\CollabController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\Admin\AdminController;
use Illuminate\Support\Facades\Route;

// ── Public Routes ───────────────────────────────────────────

Route::get('/health', [AuthController::class, 'health']);

// ── Auth Routes ─────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1'); // 5 attempts per minute per IP

    Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
    Route::get('/google/callback', [AuthController::class, 'googleCallback']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// ── Public Post Routes ──────────────────────────────────────

Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/mine', [PostController::class, 'mine'])
    ->middleware(['auth:sanctum', 'role:entrepreneur']);
Route::get('/posts/{post}', [PostController::class, 'show']);

// ── Public Comment Routes ───────────────────────────────────

Route::get('/posts/{post}/comments', [CommentController::class, 'index']);

// ── Public Profile Routes ───────────────────────────────────

Route::get('/profile/{userId}', [ProfileController::class, 'show']);

// ── Authenticated Routes ────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // ── Posts (Entrepreneur only) ───────────────────────────
    Route::post('/posts', [PostController::class, 'store'])
        ->middleware('role:entrepreneur');
    Route::put('/posts/{post}', [PostController::class, 'update'])
        ->middleware('role:entrepreneur');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])
        ->middleware('role:entrepreneur');

    // ── AI Services (Entrepreneur only) ──────────────────────
    Route::post('/ai/enhance-pitch', [AiController::class, 'enhancePitch'])
        ->middleware('role:entrepreneur');

    // ── Votes ───────────────────────────────────────────────
    Route::post('/posts/{post}/vote', [VoteController::class, 'vote'])
        ->middleware('throttle:30,1'); // 30 per minute

    // ── Comments ────────────────────────────────────────────
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // ── Collaboration Requests ──────────────────────────────
    Route::post('/posts/{post}/collab', [CollabController::class, 'store'])
        ->middleware('role:investor');
    Route::get('/collab/received', [CollabController::class, 'received'])
        ->middleware('role:entrepreneur');
    Route::get('/collab/sent', [CollabController::class, 'sent'])
        ->middleware('role:investor');
    Route::patch('/collab/{collabRequest}/accept', [CollabController::class, 'accept'])
        ->middleware('role:entrepreneur');
    Route::patch('/collab/{collabRequest}/reject', [CollabController::class, 'reject'])
        ->middleware('role:entrepreneur');
    Route::delete('/collab/{collabRequest}', [CollabController::class, 'withdraw'])
        ->middleware('role:investor');

    // ── Messages ────────────────────────────────────────────
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::get('/messages/{userId}', [MessageController::class, 'thread']);
    Route::post('/messages/{userId}', [MessageController::class, 'send'])
        ->middleware('throttle:60,1'); // 60 per minute
    Route::patch('/messages/{userId}/read', [MessageController::class, 'markAsRead']);

    // ── Notifications ───────────────────────────────────────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);

    // ── Profile ─────────────────────────────────────────────
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/sync-linkedin', [ProfileController::class, 'syncLinkedin']);

    // ── Bookmarks ───────────────────────────────────────────
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::post('/posts/{post}/bookmark', [BookmarkController::class, 'toggle']);

    // ── Reports ─────────────────────────────────────────────
    Route::post('/report', [ReportController::class, 'store']);
});

// ── Admin Routes ────────────────────────────────────────────

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:super_admin'])
    ->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{user}/ban', [AdminController::class, 'banUser']);
        Route::patch('/users/{user}/unban', [AdminController::class, 'unbanUser']);
        Route::delete('/posts/{post}', [AdminController::class, 'deletePost']);
        Route::delete('/comments/{comment}', [AdminController::class, 'deleteComment']);
        Route::get('/reports', [AdminController::class, 'reports']);
        Route::patch('/reports/{report}/review', [AdminController::class, 'reviewReport']);
    });
