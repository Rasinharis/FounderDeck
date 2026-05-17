<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar_url',
        'bio',
        'linkedin_url',
        'github_url',
        'google_id',
        'is_banned',
        'ban_reason',
        'profile_completed',
        'skills',
        'linkedin_credentials',
        'mutual_connections_count',
        'is_linkedin_verified',
        'is_angellist_verified',
        'is_crunchbase_verified',
        'scorecard_wins',
        'scorecard_exits',
        'scorecard_collabs',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_banned' => 'boolean',
            'profile_completed' => 'boolean',
            'skills' => 'array',
            'linkedin_credentials' => 'array',
            'is_linkedin_verified' => 'boolean',
            'is_angellist_verified' => 'boolean',
            'is_crunchbase_verified' => 'boolean',
        ];
    }

    // ── Role checks ─────────────────────────────────────────

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isEntrepreneur(): bool
    {
        return $this->role === 'entrepreneur';
    }

    public function isInvestor(): bool
    {
        return $this->role === 'investor';
    }

    // ── Relationships ───────────────────────────────────────

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function sentCollabRequests(): HasMany
    {
        return $this->hasMany(CollaborationRequest::class, 'sender_id');
    }

    public function receivedCollabRequests(): HasMany
    {
        return $this->hasMany(CollaborationRequest::class, 'receiver_id');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'reporter_id');
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }
}
