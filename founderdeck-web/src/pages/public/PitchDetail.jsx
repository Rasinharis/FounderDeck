import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { getPost } from '../../api/posts';
import { useAuthStore } from '../../store/useAuthStore';
import { formatStage, getPostImage, initials, numberCompact } from '../../lib/format';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Loader2,
  MessageSquare,
  Pencil,
  Play,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserPlus,
  Heart,
  Handshake,
  Coins,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function PitchDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [pitch, setPitch] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [collabMessage, setCollabMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSendingCollab, setIsSendingCollab] = useState(false);
  const [error, setError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editBody, setEditBody] = useState('');

  const isOwner = user?.id && pitch?.user?.id === user.id;
  const canRequestCollab = isAuthenticated && user?.role === 'investor' && !isOwner;

  const loadPitch = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [{ data: postData }, { data: commentData }] = await Promise.all([
        getPost(id),
        api.get(`/posts/${id}/comments`),
      ]);
      setPitch(postData.data);
      setComments(commentData.data ?? []);
      setCollabMessage(`Hi ${postData.data.user?.name ?? 'there'}, I like ${postData.data.title} and would like to explore a collaboration or investment conversation.`);
    } catch {
      setError('This pitch could not be loaded. It may have been removed or the API is unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPitch();
  }, [loadPitch]);

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to cast a signal or vote.');
      return;
    }

    try {
      const { data } = await api.post(`/posts/${id}/vote`, { vote_type: voteType });
      setPitch((current) => ({
        ...current,
        upvotes_count: data.upvotes,
        downvotes_count: data.downvotes,
        weighted_score: data.weighted_score,
        seeking_cofounder_count: data.seeking_cofounder_count,
        looking_to_invest_count: data.looking_to_invest_count,
        need_advisor_count: data.need_advisor_count,
        user_vote: data.user_vote,
      }));

      const formattedLabel = {
        up: 'Upvoted pitch!',
        down: 'Downvoted pitch.',
        seeking_cofounder: '🤝 Intent cast: Seeking Co-Founder',
        looking_to_invest: '💸 Intent cast: Looking to Invest',
        need_advisor: '💡 Intent cast: Need Advisor',
      }[voteType] || 'Signal updated!';

      toast.success(formattedLabel);
    } catch (voteError) {
      toast.error(voteError.response?.data?.message || 'Could not save your vote.');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save bookmarks.');
      return;
    }

    try {
      const { data } = await api.post(`/posts/${id}/bookmark`);
      setPitch((current) => ({
        ...current,
        is_bookmarked: data.is_bookmarked,
      }));
      toast.success(data.message);
    } catch (err) {
      toast.error('Bookmark update failed.');
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to comment.');
      return;
    }
    if (!comment.trim()) return;

    setIsCommenting(true);
    try {
      const { data } = await api.post(`/posts/${id}/comments`, { body: comment.trim() });
      setComments((current) => [data.data, ...current]);
      setPitch((current) => ({ ...current, comments_count: (current.comments_count ?? 0) + 1 }));
      setComment('');
      toast.success('Comment posted');
    } catch (commentError) {
      toast.error(commentError.response?.data?.message || 'Could not post comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((current) => current.filter((c) => c.id !== commentId));
      setPitch((current) => ({ ...current, comments_count: Math.max(0, (current.comments_count ?? 1) - 1) }));
      toast.success('Comment deleted');
    } catch {
      toast.error('Could not delete comment.');
    }
  };

  const handleCommentEditSave = async (commentId) => {
    if (!editBody.trim()) return;
    try {
      const { data } = await api.put(`/comments/${commentId}`, { body: editBody.trim() });
      setComments((current) => current.map((c) => (c.id === commentId ? data.data : c)));
      setEditingCommentId(null);
      setEditBody('');
      toast.success('Comment updated');
    } catch {
      toast.error('Could not update comment.');
    }
  };

  const handleCollab = async (event) => {
    event.preventDefault();
    if (!canRequestCollab || !collabMessage.trim()) return;

    setIsSendingCollab(true);
    try {
      await api.post(`/posts/${id}/collab`, { message: collabMessage.trim() });
      toast.success('Collaboration request sent');
    } catch (collabError) {
      toast.error(collabError.response?.data?.message || 'Could not send collaboration request.');
    } finally {
      setIsSendingCollab(false);
    }
  };

  // Convert standard URLs to active embeds
  const getEmbedUrl = (url) => {
    if (!url) return null;
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    if (url.includes('loom.com/share/')) {
      return url.replace('loom.com/share/', 'loom.com/embed/');
    }
    return url;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA] pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF5C00]" />
      </div>
    );
  }

  if (error || !pitch) {
    return (
      <main className="min-h-screen bg-[#EAEAEA] px-4 pt-28 text-[#111111]">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-500/20 bg-red-50 p-6 text-red-600 font-bold">{error}</div>
      </main>
    );
  }

  const cover = getPostImage(pitch);
  const totalScore = pitch.weighted_score ?? ((pitch.upvotes_count ?? 0) - (pitch.downvotes_count ?? 0));

  return (
    <main className="min-h-screen bg-[#EAEAEA] pt-16 text-[#111111] pb-12">
      <section className="border-b border-black/5 bg-[#F4F4F4]/50 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded-md bg-[#FF5C00]/10 px-3 py-1 text-sm font-bold text-[#FF5C00]">{pitch.industry}</span>
              <span className="rounded-md bg-gray-950 px-3 py-1 text-sm font-bold text-white">{formatStage(pitch.funding_stage)}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="max-w-4xl text-4xl font-display font-black tracking-tight sm:text-5xl text-[#111111]">
                {pitch.title}
              </h1>
              <button
                type="button"
                onClick={handleBookmarkToggle}
                className="p-2 rounded-full hover:bg-black/5 text-gray-400 hover:text-red-500 transition-all cursor-pointer border-none bg-transparent"
                title={pitch.is_bookmarked ? "Remove Bookmark" : "Bookmark Pitch"}
              >
                <Heart className={`h-7 w-7 ${pitch.is_bookmarked ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-500 font-semibold">{pitch.tagline}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to={`/profile/${pitch.user?.id}`} className="inline-flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-2.5 transition hover:border-[#FF5C00]/40 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5C00]/15 text-sm font-bold text-[#FF5C00]">
                  {initials(pitch.user?.name)}
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-800">{pitch.user?.name ?? 'Founder'}</span>
                  <span className="block text-xs text-gray-400 font-semibold">View founder profile</span>
                </span>
              </Link>
              {isOwner && (
                <Link
                  to={`/dashboard/entrepreneur/pitches/${pitch.id}/edit`}
                  className="rounded-full bg-[#FF5C00] hover:bg-[#E65300] px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-[#FF5C00]/15 hover:scale-[1.02]"
                >
                  Edit Pitch
                </Link>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="h-56 bg-gray-100">
              {cover ? (
                <img src={cover} alt={pitch.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(255,92,0,0.15),transparent_35%),linear-gradient(135deg,#F4F4F4,#EAEAEA)]">
                  <span className="text-4xl font-display font-black text-[#FF5C00]">{initials(pitch.title)}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 divide-x divide-black/5 border-t border-black/5 text-center">
              <div className="p-4">
                <p className="text-xl font-display font-black text-[#FF5C00]">{numberCompact(totalScore)}</p>
                <p className="text-xs font-semibold text-gray-400">Score</p>
              </div>
              <div className="p-4">
                <p className="text-xl font-display font-black text-[#111111]">{numberCompact(pitch.comments_count)}</p>
                <p className="text-xs font-semibold text-gray-400">Comments</p>
              </div>
              <div className="p-4">
                <p className="text-xl font-display font-black text-[#111111]">{numberCompact(pitch.views_count)}</p>
                <p className="text-xs font-semibold text-gray-400">Views</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-8">
          
          {/* AI One-Liner Summary Box */}
          {pitch.one_liner_summary && (
            <div className="rounded-2xl border border-[#FF5C00]/10 bg-[#FF5C00]/5 p-5 flex gap-4 items-start shadow-sm">
              <Sparkles className="h-6 w-6 text-[#FF5C00] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[#FF5C00] font-display">AI Validation Summary</h4>
                <p className="mt-1 text-base font-bold text-gray-800 leading-relaxed">{pitch.one_liner_summary}</p>
              </div>
            </div>
          )}

          {/* Loom / YouTube Video pitch */}
          {pitch.video_url && (
            <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-display font-black text-[#111111] flex items-center gap-1.5">
                <Play className="h-4 w-4 text-[#FF5C00] fill-current" /> Elevator Pitch video
              </h2>
              <div className="aspect-video w-full overflow-hidden rounded-xl border border-black/5 bg-gray-50">
                <iframe
                  src={getEmbedUrl(pitch.video_url)}
                  title="Elevator Pitch Video"
                  className="h-full w-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </article>
          )}

          {/* Slides Carousel */}
          {pitch.slides && pitch.slides.length > 0 && (
            <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-display font-black text-[#111111]">Pitch Deck Slides</h2>
              <SlideCarousel slides={pitch.slides} />
            </article>
          )}

          <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-display font-black text-[#111111]">Pitch Description</h2>
            <p className="mt-4 whitespace-pre-wrap leading-8 text-gray-600 font-medium text-sm sm:text-base">{pitch.description}</p>

            {(pitch.tech_stack?.length > 0 || pitch.tags?.length > 0) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {(pitch.tech_stack ?? []).map((item) => (
                  <span key={item} className="rounded-full bg-[#F4F4F4] border border-black/5 px-3 py-1 text-sm font-semibold text-gray-600">{item}</span>
                ))}
                {(pitch.tags ?? []).map((tag) => (
                  <span key={tag.id ?? tag.name} className="rounded-full border border-[#FF5C00]/10 bg-[#FF5C00]/5 px-3 py-1 text-sm font-bold text-[#FF5C00]">#{tag.name}</span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {pitch.demo_url && (
                <a href={pitch.demo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F4F4F4]/50 px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-[#FF5C00]/40">
                  Live demo <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              {pitch.github_repo_url && (
                <a href={pitch.github_repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F4F4F4]/50 px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-[#FF5C00]/40">
                  <Code2 className="h-4 w-4" /> GitHub
                </a>
              )}
            </div>
          </article>

          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-display font-black text-[#111111]">Founder Feedback</h2>
              <span className="text-sm font-semibold text-gray-400">{comments.length} comments</span>
            </div>

            <form onSubmit={handleComment} className="mb-6">
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder={isAuthenticated ? 'Share feedback, a question, or validation insight...' : 'Log in to comment'}
                disabled={!isAuthenticated}
                className="w-full resize-y rounded-xl border border-black/5 bg-[#F4F4F4] p-3 text-sm leading-6 text-gray-800 font-semibold outline-none transition focus:border-[#FF5C00] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!isAuthenticated || isCommenting || !comment.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FF5C00] hover:bg-[#E65300] px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-[#FF5C00]/15 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer border-none"
                >
                  {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Post Comment
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="rounded-xl bg-[#F4F4F4] p-4 text-sm font-semibold text-gray-400">No comments yet. Be the first to add useful feedback.</p>
              ) : comments.map((item) => {
                const isOwnerComment = user?.id && item.user?.id === user.id;
                const isEditing = editingCommentId === item.id;
                return (
                  <article key={item.id} className="rounded-xl border border-black/5 bg-[#F4F4F4] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5C00]/10 text-xs font-bold text-[#FF5C00]">
                          {initials(item.user?.name)}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{item.user?.name ?? 'Member'}</p>
                          <p className="text-xs text-gray-400 font-semibold">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {isOwnerComment && !isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setEditingCommentId(item.id); setEditBody(item.body); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF5C00] hover:bg-white transition-all border-none bg-transparent cursor-pointer"
                            title="Edit comment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCommentDelete(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white transition-all border-none bg-transparent cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={3}
                          className="w-full resize-y rounded-xl border border-[#FF5C00] bg-white p-3 text-sm leading-6 text-gray-800 font-semibold outline-none transition"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setEditingCommentId(null); setEditBody(''); }}
                            className="px-3 py-1.5 rounded-full border border-black/10 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCommentEditSave(item.id)}
                            disabled={!editBody.trim()}
                            className="px-3 py-1.5 rounded-full bg-[#FF5C00] hover:bg-[#E65300] text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer border-none"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600 font-semibold">{item.body}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          
          {/* Reaction intent selector */}
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-display font-black text-[#111111] uppercase tracking-tight">Signal Intent</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleVote('up')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition border cursor-pointer ${
                  pitch.user_vote === 'up' ? 'bg-[#FF5C00] text-white border-[#FF5C00] shadow-sm' : 'bg-[#F4F4F4] border-black/5 text-gray-700 hover:bg-black/5'
                }`}
              >
                👍 Up ({pitch.upvotes_count ?? 0})
              </button>
              <button
                type="button"
                onClick={() => handleVote('down')}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition border cursor-pointer ${
                  pitch.user_vote === 'down' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-[#F4F4F4] border-black/5 text-gray-700 hover:bg-black/5'
                }`}
              >
                👎 Down ({pitch.downvotes_count ?? 0})
              </button>
              <button
                type="button"
                onClick={() => handleVote('seeking_cofounder')}
                className={`col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition border cursor-pointer ${
                  pitch.user_vote === 'seeking_cofounder' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-[#F4F4F4] border-black/5 text-gray-700 hover:bg-black/5'
                }`}
              >
                🤝 Seeking Co-Founder
              </button>
              <button
                type="button"
                onClick={() => handleVote('looking_to_invest')}
                className={`col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition border cursor-pointer ${
                  pitch.user_vote === 'looking_to_invest' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-[#F4F4F4] border-black/5 text-gray-700 hover:bg-black/5'
                }`}
              >
                💸 Looking to Invest
              </button>
              <button
                type="button"
                onClick={() => handleVote('need_advisor')}
                className={`col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition border cursor-pointer ${
                  pitch.user_vote === 'need_advisor' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-[#F4F4F4] border-black/5 text-gray-700 hover:bg-black/5'
                }`}
              >
                💡 Need Advisor
              </button>
            </div>

            {/* Signals counts Breakdown indicators */}
            <div className="border-t border-black/5 pt-3.5 space-y-2">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Active validation breakdowns</span>
              <div className="flex flex-wrap gap-2 text-2xs font-bold uppercase tracking-wider text-gray-500">
                <span className="bg-blue-50 border border-blue-100 rounded px-2 py-0.5 text-blue-600">🤝 {pitch.seeking_cofounder_count ?? 0} Partners</span>
                <span className="bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 text-emerald-600">💸 {pitch.looking_to_invest_count ?? 0} Investors</span>
                <span className="bg-amber-50 border border-amber-100 rounded px-2 py-0.5 text-amber-600">💡 {pitch.need_advisor_count ?? 0} Advisors</span>
              </div>
            </div>

          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-display font-black text-[#111111]">Connect</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 font-semibold">Investors can request collaboration. Accepted requests can move into private encrypted messaging.</p>
            {canRequestCollab ? (
              <form onSubmit={handleCollab} className="mt-4 space-y-3">
                <textarea
                  value={collabMessage}
                  onChange={(event) => setCollabMessage(event.target.value)}
                  rows={5}
                  className="w-full resize-y rounded-xl border border-black/5 bg-[#F4F4F4] p-3 text-sm leading-6 text-gray-800 font-semibold outline-none transition focus:border-[#FF5C00]"
                />
                <button
                  type="submit"
                  disabled={isSendingCollab || !collabMessage.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF5C00] hover:bg-[#E65300] px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-[#FF5C00]/15 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer border-none"
                >
                  {isSendingCollab ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Request Collaboration
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-xl bg-[#F4F4F4] p-4 text-sm font-semibold text-gray-500">
                {isAuthenticated ? 'Collaboration requests are available from investor accounts.' : 'Log in as an investor to request collaboration.'}
              </div>
            )}
            {isAuthenticated && !isOwner && (
              <Link
                to={`/messages?user=${pitch.user?.id}`}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-[#F4F4F4]/50 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-[#FF5C00]/40"
              >
                <MessageSquare className="h-4 w-4" />
                Message Founder
              </Link>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

// ── Slide Deck Sub-Carousel Component ──────────────────
function SlideCarousel({ slides }) {
  const [slideIndex, setSlideIndex] = useState(0);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative rounded-xl border border-black/5 overflow-hidden group">
      <div className="h-64 bg-gray-950 flex items-center justify-center">
        <img
          src={slides[slideIndex]}
          alt={`Slide ${slideIndex + 1}`}
          className="h-full w-full object-contain"
        />
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white text-gray-800 p-1.5 transition-all shadow-md border border-black/5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white text-gray-800 p-1.5 transition-all shadow-md border border-black/5 cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlideIndex(idx)}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === slideIndex ? 'bg-[#FF5C00] w-3' : 'bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
