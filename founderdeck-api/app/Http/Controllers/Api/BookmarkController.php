<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Bookmark;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    /**
     * Get all bookmarked posts for the current authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Fetch posts that are bookmarked by the user
        $posts = Post::query()
            ->whereHas('bookmarks', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with(['user', 'tags'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => PostResource::collection($posts),
        ]);
    }

    /**
     * Bookmark or unbookmark a post.
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();

        $existing = Bookmark::where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $isBookmarked = false;
        } else {
            Bookmark::create([
                'user_id' => $user->id,
                'post_id' => $post->id,
            ]);
            $isBookmarked = true;
        }

        return response()->json([
            'is_bookmarked' => $isBookmarked,
            'message' => $isBookmarked ? 'Pitch bookmarked successfully.' : 'Pitch removed from bookmarks.',
        ]);
    }
}
