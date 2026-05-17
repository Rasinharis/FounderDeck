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
            'upvotes_count' => $this->whenCounted('upvotes', fn() => $this->votes()->where('vote_type', 'up')->count()),
            'downvotes_count' => $this->whenCounted('downvotes', fn() => $this->votes()->where('vote_type', 'down')->count()),
            'comments_count' => $this->whenCounted('comments', fn() => $this->comments()->count()),
            'collab_requests_count' => $this->whenCounted('collaborationRequests', fn() => $this->collaborationRequests()->count()),
            'user_vote' => $this->when(
                $request->user(),
                fn() => $this->votes()->where('user_id', $request->user()?->id)->value('vote_type')
            ),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
