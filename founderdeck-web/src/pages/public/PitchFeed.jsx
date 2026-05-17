import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { getPosts } from '../../api/posts';
import { useAuthStore } from '../../store/useAuthStore';
import { formatStage, getPostImage, initials, numberCompact } from '../../lib/format';
import {
  ArrowUpRight,
  ChevronRight,
  Code2,
  Eye,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

const industries = ['All', 'Technology', 'FinTech', 'HealthTech', 'EdTech', 'E-Commerce', 'SaaS', 'Web3', 'CleanTech', 'Logistics'];
const stages = [
  { label: 'All stages', value: '' },
  { label: 'Idea', value: 'idea' },
  { label: 'MVP', value: 'mvp' },
  { label: 'Seed', value: 'seed' },
  { label: 'Series A', value: 'series_a' },
  { label: 'Co-founder search', value: 'looking_for_cofounders' },
];

export default function PitchFeed() {
  const { isAuthenticated, user } = useAuthStore();
  const [pitches, setPitches] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [stage, setStage] = useState('');
  const [sort, setSort] = useState('trending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Preview Modal state
  const [previewPitch, setPreviewPitch] = useState(null);
  const [previewComments, setPreviewComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  const params = useMemo(() => ({
    search: search || undefined,
    industry: industry !== 'All' ? industry : undefined,
    funding_stage: stage || undefined,
    sort,
    per_page: 12,
  }), [industry, search, sort, stage]);

  const loadPosts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await getPosts(params);
      setPitches(data.data ?? []);
      setMeta(data.meta ?? null);
    } catch {
      setError('Could not load pitches right now. Please check that the Laravel API is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [params]);

  // Handle inline vote directly from card
  const handleInlineVote = async (event, pitchId, voteType) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to vote.');
      return;
    }

    try {
      const { data } = await api.post(`/posts/${pitchId}/vote`, { vote_type: voteType });
      
      // Update local feed state
      setPitches((current) =>
        current.map((item) =>
          item.id === pitchId
            ? {
                ...item,
                upvotes_count: data.upvotes,
                downvotes_count: data.downvotes,
                user_vote: data.user_vote,
              }
            : item
        )
      );

      // If active preview is open, update it too
      if (previewPitch && previewPitch.id === pitchId) {
        setPreviewPitch((current) => ({
          ...current,
          upvotes_count: data.upvotes,
          downvotes_count: data.downvotes,
          user_vote: data.user_vote,
        }));
      }

      toast.success(voteType === 'upvote' ? 'Upvoted pitch!' : 'Downvoted pitch.');
    } catch (voteError) {
      toast.error(voteError.response?.data?.message || 'Could not save your vote.');
    }
  };

  // Open Quick View Modal
  const openQuickView = async (event, pitch) => {
    event.preventDefault();
    event.stopPropagation();
    setPreviewPitch(pitch);
    setPreviewComments([]);
    setNewComment('');

    try {
      const { data } = await api.get(`/posts/${pitch.id}/comments`);
      setPreviewComments(data.data ?? []);
    } catch {
      // Ignored non-blocking comments load
    }
  };

  // Submit comment inside Quick View Modal
  const submitQuickComment = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to comment.');
      return;
    }
    if (!newComment.trim() || !previewPitch) return;

    setIsCommenting(true);
    try {
      const { data } = await api.post(`/posts/${previewPitch.id}/comments`, { body: newComment.trim() });
      setPreviewComments((current) => [data.data, ...current]);
      
      // Update count inside local feed state
      setPitches((current) =>
        current.map((item) =>
          item.id === previewPitch.id
            ? { ...item, comments_count: (item.comments_count ?? 0) + 1 }
            : item
        )
      );

      setPreviewPitch((current) => ({
        ...current,
        comments_count: (current.comments_count ?? 0) + 1,
      }));

      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (commentError) {
      toast.error('Could not post comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EAEAEA] pt-20 pb-12 text-[#111111]">
      {/* Dynamic Jumbotron Header */}
      <section className="border-b border-black/5 bg-[#F4F4F4]/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF5C00] font-display flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Interactive Matchmaking Room
              </p>
              <h1 className="mt-2 text-3xl font-display font-black tracking-tight sm:text-4xl text-[#111111]">Discover founder ideas</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-500">
                Browse ideas, vote instantly directly from the feed, preview pitch decks with Quick View, and submit comments.
              </p>
            </div>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex w-fit items-center justify-center rounded-full bg-[#FF5C00] hover:bg-[#E65300] px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-[#FF5C00]/15 hover:scale-[1.02]"
              >
                Join FounderDeck
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Interactive Filters Grid */}
          <div className="space-y-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            {/* Industry Horizontal Clickable Pills */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Filter by Industry</span>
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-h-[85px]">
                {industries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setIndustry(item)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                      (item === 'All' && industry === 'All') || (item === industry)
                        ? 'bg-[#FF5C00] text-white shadow-sm shadow-[#FF5C00]/15'
                        : 'bg-[#F4F4F4] text-gray-600 border border-black/5 hover:bg-black/5'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 pt-2 md:grid-cols-[1fr_200px_200px]">
              {/* Interactive Search Bar */}
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, key tagline, or stack..."
                  className="h-11 w-full rounded-xl border border-black/5 bg-[#F4F4F4] pl-10 pr-3 text-sm text-gray-800 font-semibold outline-none transition focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00]"
                />
              </label>

              {/* Stage select */}
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                className="h-11 rounded-xl border border-black/5 bg-[#F4F4F4] px-3.5 text-sm text-gray-800 font-semibold outline-none transition focus:border-[#FF5C00]"
              >
                {stages.map((item) => (
                  <option key={item.label} value={item.value}>{item.label}</option>
                ))}
              </select>

              {/* Sort selector */}
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 rounded-xl border border-black/5 bg-[#F4F4F4] px-3.5 text-sm text-gray-800 font-semibold outline-none transition focus:border-[#FF5C00]"
              >
                <option value="trending">🔥 Trending</option>
                <option value="latest">✨ Latest</option>
                <option value="most_voted">🏆 Most Voted</option>
                <option value="most_viewed">👁️ Most Viewed</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid View */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between text-sm font-semibold text-gray-500">
          <span>{meta?.total ? `${meta.total} pitches found` : 'Explore validation pitches'}</span>
          <span className="inline-flex items-center gap-2"><Filter className="h-4 w-4" /> Interactive Feed</span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF5C00]" />
          </div>
        ) : pitches.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white p-12 text-center shadow-sm">
            <h2 className="text-xl font-display font-black text-[#111111] uppercase tracking-tight">No pitches matched your filters</h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">Clear your search parameters or start a new category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pitches.map((pitch) => {
              const cover = getPostImage(pitch);
              const totalScore = (pitch.upvotes_count ?? 0) - (pitch.downvotes_count ?? 0);
              
              return (
                <article
                  key={pitch.id}
                  className="group relative flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#FF5C00]/40 hover:shadow-lg"
                >
                  <Link to={`/pitches/${pitch.id}`} className="absolute inset-0 z-0" aria-label="View pitch details" />

                  {/* Banner Cover */}
                  <div className="relative h-44 overflow-hidden bg-gray-100 z-10">
                    {cover ? (
                      <img src={cover} alt={pitch.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(255,92,0,0.15),transparent_32%),linear-gradient(135deg,#F4F4F4,#EAEAEA_55%,#FF5C00/5)]">
                        <span className="text-3xl font-display font-black text-[#FF5C00]">{initials(pitch.title)}</span>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-md bg-[#FF5C00]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#FF5C00]">
                      {pitch.industry}
                    </div>
                    <div className="absolute right-3 top-3 rounded-md bg-gray-950 px-2.5 py-0.5 text-xs font-bold text-white">
                      {formatStage(pitch.funding_stage)}
                    </div>
                    
                    {/* Hover Quick View Trigger */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(event) => openQuickView(event, pitch)}
                        className="rounded-full bg-white text-[#111111] hover:bg-[#FF5C00] hover:text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md transform translate-y-2 group-hover:translate-y-0 duration-300 cursor-pointer"
                      >
                        Quick Preview
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5 z-10 pointer-events-none">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF5C00]/10 text-sm font-bold text-[#FF5C00]">
                        {initials(pitch.user?.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-800">{pitch.user?.name ?? 'Founder'}</p>
                        <p className="text-xs text-gray-400 font-semibold">Founder</p>
                      </div>
                    </div>
                    <h2 className="text-xl font-display font-black tracking-tight text-[#111111] group-hover:text-[#FF5C00] transition-colors leading-tight">
                      {pitch.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500 font-semibold">
                      {pitch.tagline}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(pitch.tags ?? []).slice(0, 3).map((tag) => (
                        <span key={tag.id ?? tag.name} className="rounded-full bg-[#F4F4F4] px-2.5 py-0.5 text-2xs text-gray-500 font-bold border border-black/5 uppercase tracking-wider">
                          #{tag.name}
                        </span>
                      ))}
                    </div>

                    {/* Interactive Bottom Bar */}
                    <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-4 text-xs font-bold text-gray-400 uppercase tracking-wider z-20 pointer-events-auto">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={(event) => handleInlineVote(event, pitch.id, 'upvote')}
                          className={`inline-flex items-center gap-1 hover:text-[#FF5C00] transition-colors p-1 rounded ${
                            pitch.user_vote === 'upvote' ? 'text-[#FF5C00]' : ''
                          }`}
                          title="Upvote pitch"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{numberCompact(pitch.upvotes_count)}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={(event) => handleInlineVote(event, pitch.id, 'downvote')}
                          className={`inline-flex items-center gap-1 hover:text-red-500 transition-colors p-1 rounded ${
                            pitch.user_vote === 'downvote' ? 'text-red-500' : ''
                          }`}
                          title="Downvote pitch"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>{numberCompact(pitch.downvotes_count)}</span>
                        </button>

                        <span className="inline-flex items-center gap-1 py-1">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span>{numberCompact(pitch.comments_count)}</span>
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-[#FF5C00] transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* --- High-Fidelity Quick Preview Modal --- */}
      {previewPitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl border border-black/5 overflow-hidden shadow-2xl animate-scale-up text-[#111111]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-[#F9F9F9] border-b border-black/5 p-5">
              <div>
                <span className="rounded-md bg-[#FF5C00]/10 px-2.5 py-0.5 text-xs font-bold uppercase text-[#FF5C00]">
                  {previewPitch.industry} &bull; {formatStage(previewPitch.funding_stage)}
                </span>
                <h3 className="text-2xl font-display font-black tracking-tight text-[#111111] mt-1">{previewPitch.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPitch(null)}
                className="rounded-full bg-[#F4F4F4] border border-black/5 hover:bg-black/10 p-2 text-gray-500 hover:text-[#111111] transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Tagline</h4>
                <p className="text-base font-semibold text-gray-700 leading-relaxed bg-[#F9F9F9] border border-black/5 p-4 rounded-xl">
                  {previewPitch.tagline}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Full Description</h4>
                <p className="text-sm font-semibold leading-relaxed text-gray-600 whitespace-pre-wrap">
                  {previewPitch.description}
                </p>
              </div>

              {/* Resource Links */}
              {(previewPitch.demo_url || previewPitch.github_repo_url) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Resource Links</h4>
                  <div className="flex flex-wrap gap-3">
                    {previewPitch.demo_url && (
                      <a
                        href={previewPitch.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F4] border border-black/5 hover:bg-black/10 px-4 py-2 text-xs font-bold text-gray-700 transition-all"
                      >
                        Live Demo <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {previewPitch.github_repo_url && (
                      <a
                        href={previewPitch.github_repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F4] border border-black/5 hover:bg-black/10 px-4 py-2 text-xs font-bold text-gray-700 transition-all"
                      >
                        <Code2 className="h-3.5 w-3.5" /> GitHub Repository
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Instant Modal Comments Section */}
              <div className="border-t border-black/5 pt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Comments & Feedback ({previewComments.length})
                </h4>
                
                {/* Instant comment input */}
                <form onSubmit={submitQuickComment} className="mb-4 flex gap-2">
                  <input
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder={isAuthenticated ? "Write validation feedback or query..." : "Log in to join the conversation"}
                    disabled={!isAuthenticated}
                    className="h-10 flex-1 rounded-xl border border-black/5 bg-[#F4F4F4] px-4 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#FF5C00] transition-shadow disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={isCommenting || !newComment.trim() || !isAuthenticated}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#FF5C00] hover:bg-[#E65300] px-4 text-xs font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCommenting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Post</span>
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {previewComments.length === 0 ? (
                    <p className="text-xs font-semibold text-gray-400 leading-relaxed italic">No feedback yet. Be the first to share validation thoughts!</p>
                  ) : (
                    previewComments.map((commentItem) => (
                      <div key={commentItem.id} className="rounded-xl border border-black/5 bg-[#F9F9F9] p-3 text-xs leading-relaxed">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-800">{commentItem.user?.name ?? 'Member'}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {new Date(commentItem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-600">{commentItem.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex justify-between items-center bg-[#F9F9F9] border-t border-black/5 p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(event) => handleInlineVote(event, previewPitch.id, 'upvote')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-black/5 bg-white text-xs font-bold transition-all ${
                    previewPitch.user_vote === 'upvote' ? 'bg-[#FF5C00]/10 border-[#FF5C00]/30 text-[#FF5C00]' : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> Upvote
                </button>
                <button
                  type="button"
                  onClick={(event) => handleInlineVote(event, previewPitch.id, 'downvote')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-black/5 bg-white text-xs font-bold transition-all ${
                    previewPitch.user_vote === 'downvote' ? 'bg-red-500/10 border-red-500/30 text-red-600' : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> Downvote
                </button>
              </div>
              
              <Link
                to={`/pitches/${previewPitch.id}`}
                onClick={() => setPreviewPitch(null)}
                className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00] hover:bg-[#E65300] shadow-md shadow-[#FF5C00]/15 px-4 py-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
              >
                <span>Full Pitch View</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
