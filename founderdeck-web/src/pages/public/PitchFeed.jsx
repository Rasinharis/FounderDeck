import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { getPosts } from '../../api/posts';
import { useAuthStore } from '../../store/useAuthStore';
import { formatStage, getPostImage, initials, numberCompact } from '../../lib/format';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Code2,
  Eye,
  Filter,
  Handshake,
  Loader2,
  MessageSquare,
  Play,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
  Send,
  Zap,
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

// Simulated real-time collaboration logs
const mockLiveActivities = [
  { id: 1, text: '🔥 Aria Investor just left a comment on FounderDeck Platform: "Matches our SaaS investment scope!"', time: '1m ago' },
  { id: 2, text: '⚡ Rohit Kumar accepted collaboration access with Super Admin', time: '3m ago' },
  { id: 3, text: '💡 Hyperion Analytics has hit trending status (12 upvotes in the last hour)', time: '5m ago' },
  { id: 4, text: '💸 Quantum Ledger just received a view check from an institutional angel', time: '7m ago' },
  { id: 5, text: '🤝 New collaboration channel opened for SaaS category pitch', time: '10m ago' },
];

export default function PitchFeed() {
  const { isAuthenticated } = useAuthStore();
  const [pitches, setPitches] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [stage, setStage] = useState('');
  const [sort, setSort] = useState('trending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Live Activity Banner cycling index
  const [activityIndex, setActivityIndex] = useState(0);

  // Quick Preview Modal state
  const [previewPitch, setPreviewPitch] = useState(null);
  const [previewComments, setPreviewComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('details');

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

  // Activity banner cycle interval
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % mockLiveActivities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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

  // Open Quick View Modal with a pre-selected focused tab
  const openQuickView = async (event, pitch, initialTab = 'details') => {
    event.preventDefault();
    event.stopPropagation();
    setPreviewPitch(pitch);
    setActiveModalTab(initialTab);
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
    if (!newComment.trim() || isCommenting || !previewPitch) return;

    setIsCommenting(true);
    try {
      const { data } = await api.post(`/posts/${previewPitch.id}/comments`, {
        body: newComment.trim(),
      });
      setPreviewComments((prev) => [data.data, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully');

      // Update feed item comments count
      setPitches((current) =>
        current.map((item) =>
          item.id === previewPitch.id
            ? { ...item, comments_count: (item.comments_count ?? 0) + 1 }
            : item
        )
      );
    } catch (commentErr) {
      toast.error(commentErr.response?.data?.message || 'Failed to post comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  // Clean iframe video embed links
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(youtubeRegExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    if (url.includes('loom.com/share/')) {
      return url.replace('loom.com/share/', 'loom.com/embed/');
    }
    return url;
  };

  return (
    <div className="space-y-6 text-[#111111] min-h-screen bg-[#EAEAEA] pb-12">
      
      {/* ── RUNNING NOW-LIVE ACTIVITY MARQUEE TICKER ── */}
      <div className="relative w-full overflow-hidden bg-black text-[#FF5C00] py-3.5 px-4 font-black uppercase text-xs tracking-widest flex items-center shadow-lg border-b border-[#FF5C00]/20">
        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping mr-3 shrink-0" />
        <span className="bg-[#FF5C00] text-black text-[9px] px-2 py-0.5 rounded font-black mr-4 uppercase shrink-0">Live Match events</span>
        <div className="w-full relative h-4 overflow-hidden">
          <div className="absolute w-full animate-marquee-text text-white/90">
            {mockLiveActivities[activityIndex].text}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4">
          <div>
            <h1 className="text-4xl font-display font-black text-[#111111] uppercase tracking-tight">Pitches Explorer</h1>
            <p className="mt-1 text-sm font-semibold text-gray-500">Discover and validate the next wave of high-growth technology startups.</p>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-4">
          
          {/* Industry Pills */}
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2.5">Filter by Industry</span>
            <div className="flex flex-wrap gap-2">
              {industries.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndustry(ind)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all border ${
                    (ind === 'All' && industry === 'All') || industry === ind
                      ? 'bg-[#FF5C00] border-[#FF5C00] text-white shadow-md'
                      : 'bg-white border-black/5 text-gray-600 hover:bg-black/5'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-center">
            
            {/* Search Input */}
            <div className="relative md:col-span-6">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, key tagline, or stack..."
                className="w-full rounded-full border border-black/5 bg-[#F4F4F4] py-2.5 pl-10 pr-4 text-xs font-semibold placeholder-gray-400 text-[#111111] outline-none focus:ring-1 focus:ring-[#FF5C00] transition-shadow"
              />
            </div>

            {/* Stage Selector */}
            <div className="relative md:col-span-3">
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                className="w-full rounded-full border border-black/5 bg-[#F4F4F4] px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#FF5C00] appearance-none cursor-pointer"
              >
                {stages.map((stg) => (
                  <option key={stg.value} value={stg.value}>
                    {stg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Toggle selector */}
            <div className="relative md:col-span-3">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="w-full rounded-full border border-black/5 bg-[#F4F4F4] px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#FF5C00] appearance-none cursor-pointer"
              >
                <option value="trending">🔥 Trending</option>
                <option value="newest">⏰ Newest Pitches</option>
                <option value="votes">📈 Net Upvotes</option>
              </select>
            </div>

          </div>
        </div>

        {/* ── TWO-COLUMN ACTIVE FEED AND MATCH ACTIVITY SIDEBAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">
                {isLoading ? 'Fetching projects...' : `${pitches.length} pitches found`}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500">
                <Filter className="h-3.5 w-3.5" /> Interactive Feed
              </span>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-black/5 shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF5C00]" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600 font-semibold shadow-sm">
                {error}
              </div>
            ) : pitches.length === 0 ? (
              <div className="rounded-2xl bg-white border border-black/5 p-12 text-center shadow-sm">
                <p className="text-sm font-semibold text-gray-400">No pitches found matching your parameters.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {pitches.map((pitch) => (
                  <PitchCard
                    key={pitch.id}
                    pitch={pitch}
                    isAuthenticated={isAuthenticated}
                    handleInlineVote={handleInlineVote}
                    openQuickView={openQuickView}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Real-time Match Activity Sidebar */}
          <div className="lg:col-span-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sticky top-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <Zap className="h-4 w-4 text-[#FF5C00]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#111111]">Match Activity Logs</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {mockLiveActivities.map((act) => (
                  <div key={act.id} className="relative pl-4 border-l border-[#FF5C00]/20 space-y-1">
                    <span className="absolute -left-1 top-1.5 h-2 w-2 rounded-full bg-[#FF5C00] animate-pulse" />
                    <p className="text-xs font-semibold leading-relaxed text-[#111111]">{act.text}</p>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">{act.time}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-black/5 flex items-center justify-between text-2xs font-bold uppercase tracking-wider text-gray-400">
                <span>Total Matches Checked</span>
                <span className="rounded bg-gray-950 px-2 py-0.5 text-white">43</span>
              </div>
            </div>
          </div>

        </div>
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
                className="rounded-full bg-[#F4F4F4] border border-black/5 hover:bg-black/10 p-2 text-gray-500 hover:text-[#111111] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              
              {/* Modal tabs selector */}
              <div className="flex border-b border-black/5 pb-2 overflow-x-auto gap-4">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('details')}
                  className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'details' ? 'border-[#FF5C00] text-[#FF5C00]' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  📝 Pitch Details
                </button>
                
                {previewPitch.video_url && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('video')}
                    className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeModalTab === 'video' ? 'border-[#FF5C00] text-[#FF5C00]' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🎥 Video Pitch
                  </button>
                )}

                {previewPitch.slides && previewPitch.slides.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('slides')}
                    className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeModalTab === 'slides' ? 'border-[#FF5C00] text-[#FF5C00]' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    🖼️ Pitch Deck Slides
                  </button>
                )}
              </div>

              {/* Tab 1: Details */}
              {activeModalTab === 'details' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Auto-generated One-Liner Summary Box */}
                  {previewPitch.one_liner_summary && (
                    <div className="rounded-xl border border-[#FF5C00]/10 bg-[#FF5C00]/5 p-4 flex gap-3 items-start">
                      <Sparkles className="h-5 w-5 text-[#FF5C00] shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">AI One-Liner Summary</h5>
                        <p className="mt-1 text-sm font-bold text-gray-800 leading-relaxed">{previewPitch.one_liner_summary}</p>
                      </div>
                    </div>
                  )}

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
                </div>
              )}

              {/* Tab 2: Video Pitch */}
              {activeModalTab === 'video' && previewPitch.video_url && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1">
                    <Play className="h-3.5 w-3.5 text-[#FF5C00] fill-current" /> Interactive Elevator Pitch
                  </h4>
                  <div className="aspect-video w-full overflow-hidden rounded-xl border border-black/5 bg-gray-50">
                    <iframe
                      src={getEmbedUrl(previewPitch.video_url)}
                      title="Elevator Pitch Video"
                      className="h-full w-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Slides Deck Carousel */}
              {activeModalTab === 'slides' && previewPitch.slides && previewPitch.slides.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Pitch Deck Slide Preview</h4>
                  <SlideCarousel slides={previewPitch.slides} />
                </div>
              )}

              {/* Comments Section */}
              <div className="border-t border-black/5 pt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Comments & Feedback ({previewComments.length})
                </h4>
                
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
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#FF5C00] hover:bg-[#E65300] px-4 text-xs font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isCommenting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Post</span>
                  </button>
                </form>

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
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-black/5 bg-white text-xs font-bold transition-all cursor-pointer ${
                    previewPitch.user_vote === 'upvote' ? 'bg-[#FF5C00]/10 border-[#FF5C00]/30 text-[#FF5C00]' : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> Upvote
                </button>
                <button
                  type="button"
                  onClick={(event) => handleInlineVote(event, previewPitch.id, 'downvote')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-black/5 bg-white text-xs font-bold transition-all cursor-pointer ${
                    previewPitch.user_vote === 'downvote' ? 'bg-red-500/10 border-red-500/30 text-red-600' : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> Downvote
                </button>
              </div>
              
              <Link
                to={`/pitches/${previewPitch.id}`}
                className="inline-flex items-center gap-1 rounded-full bg-[#FF5C00] hover:bg-[#E65300] px-5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-[#FF5C00]/15"
              >
                <span>Full Pitch View</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ── SUB-COMPONENT: PITCH CARD ──────────────────────────────────────────
function PitchCard({ pitch, isAuthenticated, handleInlineVote, openQuickView }) {
  const cover = getPostImage(pitch);
  const totalScore = (pitch.upvotes_count ?? 0) - (pitch.downvotes_count ?? 0);
  
  return (
    <article className="group relative flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#FF5C00]/40 hover:shadow-lg">
      <Link to={`/pitches/${pitch.id}`} className="absolute inset-0 z-0" aria-label="View pitch details" />

      {/* Banner Cover with Slide / Video indicators */}
      <div className="relative h-44 overflow-hidden bg-gray-100 z-10">
        {cover ? (
          <img src={cover} alt={pitch.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(255,92,0,0.15),transparent_32%),linear-gradient(135deg,#F4F4F4,#EAEAEA_55%,#FF5C00/5)]">
            <span className="text-3xl font-display font-black text-[#FF5C00]">{initials(pitch.title)}</span>
          </div>
        )}
        
        {/* Industry Badge */}
        <div className="absolute left-3 top-3 rounded-md bg-[#FF5C00]/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#FF5C00]">
          {pitch.industry}
        </div>
        
        {/* Stage Badge */}
        <div className="absolute right-3 top-3 rounded-md bg-gray-950 px-2.5 py-0.5 text-xs font-bold text-white">
          {formatStage(pitch.funding_stage)}
        </div>

        {/* Dynamic Rich-Media Badge Overlays */}
        <div className="absolute left-3 bottom-3 flex gap-2 z-20">
          {pitch.video_url && (
            <button
              type="button"
              onClick={(event) => openQuickView(event, pitch, 'video')}
              className="inline-flex items-center gap-1 rounded bg-[#FF5C00] hover:bg-[#E65300] hover:scale-105 active:scale-95 text-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow cursor-pointer transition-all border-none"
            >
              <Play className="h-2.5 w-2.5 fill-current" /> Video
            </button>
          )}
          {pitch.slides && pitch.slides.length > 0 && (
            <button
              type="button"
              onClick={(event) => openQuickView(event, pitch, 'slides')}
              className="inline-flex items-center gap-1 rounded bg-gray-950 hover:bg-gray-800 hover:scale-105 active:scale-95 text-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow cursor-pointer transition-all border-none"
            >
              Slides ({pitch.slides.length})
            </button>
          )}
        </div>
        
        {/* Hover Quick View Trigger */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
          <button
            type="button"
            onClick={(event) => openQuickView(event, pitch, 'details')}
            className="rounded-full bg-white text-[#111111] hover:bg-[#FF5C00] hover:text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md transform translate-y-2 group-hover:translate-y-0 duration-300 cursor-pointer"
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="flex flex-1 flex-col p-5 z-10 pointer-events-none">
        
        {/* Creator Info */}
        <div className="mb-3.5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5C00]/10 text-xs font-bold text-[#FF5C00]">
            {initials(pitch.user?.name ?? 'Founder')}
          </div>
          <div>
            <p className="text-xs font-bold text-[#111111] leading-none">{pitch.user?.name ?? 'Founder'}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5 leading-none">Founder</p>
          </div>
        </div>

        {/* Title & Tagline */}
        <h3 className="font-display text-lg font-black tracking-tight text-[#111111] group-hover:text-[#FF5C00] transition-colors">
          {pitch.title}
        </h3>
        
        {/* Distilled AI One-liner summary (Always featured for clean scannability!) */}
        {pitch.one_liner_summary && (
          <p className="mt-2 text-2xs font-bold text-[#FF5C00] leading-normal uppercase bg-[#FF5C00]/5 border border-[#FF5C00]/10 px-2 py-1 rounded">
            💡 {pitch.one_liner_summary}
          </p>
        )}

        <p className="mt-2.5 line-clamp-3 text-xs font-semibold text-gray-500 leading-relaxed">
          {pitch.tagline}
        </p>

        {/* Card Footer Actions (Net votes & comment counter) */}
        <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between text-xs font-bold text-gray-500 pointer-events-auto">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(event) => handleInlineVote(event, pitch.id, 'upvote')}
              className={`inline-flex items-center justify-center p-1.5 rounded-full border border-black/5 bg-[#F9F9F9] transition-all hover:bg-black/5 cursor-pointer ${
                pitch.user_vote === 'upvote' ? 'bg-[#FF5C00]/10 border-[#FF5C00]/25 text-[#FF5C00]' : 'text-gray-500'
              }`}
              aria-label="Upvote pitch"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            
            <span className={`text-xs font-black font-display ${totalScore > 0 ? 'text-green-600' : totalScore < 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {totalScore > 0 ? `+${totalScore}` : totalScore}
            </span>

            <button
              type="button"
              onClick={(event) => handleInlineVote(event, pitch.id, 'downvote')}
              className={`inline-flex items-center justify-center p-1.5 rounded-full border border-black/5 bg-[#F9F9F9] transition-all hover:bg-black/5 cursor-pointer ${
                pitch.user_vote === 'downvote' ? 'bg-red-500/10 border-red-500/25 text-red-500' : 'text-gray-500'
              }`}
              aria-label="Downvote pitch"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{pitch.comments_count ?? 0}</span>
          </div>

        </div>
      </div>
    </article>
  );
}

// ── SUB-COMPONENT: SLIDES CAROUSEL ─────────────────────────────────────
function SlideCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0);

  const prev = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  };

  const next = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current === slides.length - 1 ? 0 : current + 1));
  };

  if (slides.length === 0) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/5 bg-black flex items-center justify-center">
      <img
        src={slides[index]}
        alt={`Slide ${index + 1}`}
        className="max-h-full max-w-full object-contain"
      />
      
      {/* Navigator arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white p-2 text-gray-800 hover:text-black transition-all shadow cursor-pointer border-none"
            aria-label="Previous slide"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white p-2 text-gray-800 hover:text-black transition-all shadow cursor-pointer border-none"
            aria-label="Next slide"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          
          {/* Indicator dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, dotIdx) => (
              <span
                key={dotIdx}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  index === dotIdx ? 'bg-[#FF5C00] w-3' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
