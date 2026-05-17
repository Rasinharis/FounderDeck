<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'tagline' => $this->tagline,
            'one_liner_summary' => $this->one_liner_summary,
            'description' => $this->description,
            'industry' => $this->industry,
            'tech_stack' => $this->tech_stack ?? [],
            'funding_stage' => $this->funding_stage,
            'cover_image_url' => $this->cover_image_url,
            'video_url' => $this->video_url,
            'slides' => $this->slides ?? [],
            'demo_url' => $this->demo_url,
            'github_repo_url' => $this->github_repo_url,
            'is_published' => $this->is_published,
            'views_count' => $this->views_count,
            'upvotes_count' => $this->votes()->where('vote_type', 'up')->count(),
            'downvotes_count' => $this->votes()->where('vote_type', 'down')->count(),
            'weighted_score' => $this->weighted_score,
            'seeking_cofounder_count' => $this->seeking_cofounder_count,
            'looking_to_invest_count' => $this->looking_to_invest_count,
            'need_advisor_count' => $this->need_advisor_count,
            'comments_count' => $this->comments()->count(),
            'collab_requests_count' => $this->collaborationRequests()->count(),
            'user_vote' => $request->user('sanctum') ? $this->votes()->where('user_id', $request->user('sanctum')->id)->value('vote_type') : null,
            'is_bookmarked' => $request->user('sanctum') ? $this->bookmarks()->where('user_id', $request->user('sanctum')->id)->exists() : false,
            'user_collab_status' => $request->user('sanctum')
                ? $this->collaborationRequests()
                    ->where('sender_id', $request->user('sanctum')->id)
                    ->whereIn('status', ['pending', 'accepted', 'rejected'])
                    ->orderByDesc('created_at')
                    ->value('status')
                : null,
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
