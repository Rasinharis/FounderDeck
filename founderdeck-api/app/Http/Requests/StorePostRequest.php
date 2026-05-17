<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isEntrepreneur();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'tagline' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'industry' => ['required', 'string', 'max:100'],
            'tech_stack' => ['nullable', 'array'],
            'tech_stack.*' => ['string', 'max:50'],
            'funding_stage' => ['required', 'in:idea,mvp,seed,series_a,looking_for_cofounders'],
            'cover_image_url' => ['nullable', 'url', 'max:2048'],
            'video_url' => ['nullable', 'url', 'max:2048'],
            'slides' => ['nullable', 'array'],
            'slides.*' => ['url', 'max:2048'],
            'one_liner_summary' => ['nullable', 'string', 'max:255'],
            'demo_url' => ['nullable', 'url', 'max:2048'],
            'github_repo_url' => ['nullable', 'url', 'max:2048'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ];
    }
}
