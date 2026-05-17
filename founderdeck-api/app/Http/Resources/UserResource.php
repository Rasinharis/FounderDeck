<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->when($this->isCurrentUser($request), $this->email),
            'role' => $this->role,
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
            'linkedin_url' => $this->linkedin_url,
            'github_url' => $this->github_url,
            'is_banned' => $this->when($request->user()?->isSuperAdmin(), $this->is_banned),
            'ban_reason' => $this->when($request->user()?->isSuperAdmin(), $this->ban_reason),
            'profile_completed' => $this->when($this->isCurrentUser($request), $this->profile_completed),
            'skills' => $this->skills ?? [],
            'linkedin_credentials' => $this->linkedin_credentials ?? [],
            'mutual_connections_count' => $this->mutual_connections_count,
            'is_linkedin_verified' => $this->is_linkedin_verified,
            'is_angellist_verified' => $this->is_angellist_verified,
            'is_crunchbase_verified' => $this->is_crunchbase_verified,
            'scorecard_wins' => $this->scorecard_wins,
            'scorecard_exits' => $this->scorecard_exits,
            'scorecard_collabs' => $this->scorecard_collabs,
            'created_at' => $this->created_at,
        ];
    }

    private function isCurrentUser(Request $request): bool
    {
        return $request->user()?->id === $this->id;
    }
}
