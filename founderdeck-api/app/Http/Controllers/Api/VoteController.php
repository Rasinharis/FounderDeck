<?php

namespace App\Http\Controllers\Api;

use App\Events\PostUpvoted;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoteController extends Controller
{
    /**
     * Cast, change, or toggle a vote on a post.
     *
     * Logic:
     * - If no existing vote → create vote row
     * - If same vote_type exists → DELETE the vote (toggle off)
     * - If different vote_type → UPDATE the existing vote row
     *
     * Returns current counts + user's vote state.
     */
    public function vote(Request $request, Post $post): JsonResponse
    {
        $request->validate([
            'vote_type' => ['required', 'in:up,down,seeking_cofounder,looking_to_invest,need_advisor'],
        ]);

        $user = $request->user();
        $voteType = $request->vote_type;

        // Calculate dynamic vote weight based on credibility
        $weight = 1;
        if ($user->role === 'investor') {
            $weight = 2;
            if ($user->is_linkedin_verified || $user->is_angellist_verified || $user->is_crunchbase_verified) {
                $weight = 3;
            }
        }

        $existingVote = Vote::where('user_id', $user->id)
            ->where('post_id', $post->id)
            ->first();

        $userVote = null;
        $isNewUpvote = false;

        if (!$existingVote) {
            // No existing vote — create new
            Vote::create([
                'user_id' => $user->id,
                'post_id' => $post->id,
                'vote_type' => $voteType,
                'weight' => $weight,
            ]);
            $userVote = $voteType;
            if ($voteType === 'up') $isNewUpvote = true;
        } elseif ($existingVote->vote_type === $voteType) {
            // Same vote — toggle off (remove)
            $existingVote->delete();
            $userVote = null;
        } else {
            // Different vote — update
            $existingVote->update([
                'vote_type' => $voteType,
                'weight' => $weight,
            ]);
            $userVote = $voteType;
            if ($voteType === 'up') $isNewUpvote = true;
        }

        // Get fresh counts
        $upvotes = $post->votes()->where('vote_type', 'up')->count();
        $downvotes = $post->votes()->where('vote_type', 'down')->count();
        $seekingCofounder = $post->votes()->where('vote_type', 'seeking_cofounder')->count();
        $lookingToInvest = $post->votes()->where('vote_type', 'looking_to_invest')->count();
        $needAdvisor = $post->votes()->where('vote_type', 'need_advisor')->count();
        $weightedScore = $post->weighted_score;

        // Dispatch notification/event if it's a new upvote and not self-voting
        if ($isNewUpvote && $user->id !== $post->user_id) {
            Notification::create([
                'user_id' => $post->user_id,
                'type' => 'post_upvoted',
                'data' => [
                    'post_id' => $post->id,
                    'post_title' => $post->title,
                    'actor_name' => $user->name,
                    'new_score' => $weightedScore,
                ],
            ]);

            broadcast(new PostUpvoted(
                $post->user_id,
                $post->id,
                $post->title,
                $user->name,
                $weightedScore
            ));
        }

        return response()->json([
            'upvotes' => $upvotes,
            'downvotes' => $downvotes,
            'weighted_score' => $weightedScore,
            'seeking_cofounder_count' => $seekingCofounder,
            'looking_to_invest_count' => $lookingToInvest,
            'need_advisor_count' => $needAdvisor,
            'user_vote' => $userVote,
        ]);
    }
}
