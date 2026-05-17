import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { formatStage, initials, numberCompact } from '../../lib/format';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  BriefcaseBusiness, 
  Code2, 
  Loader2, 
  MessageSquare, 
  ThumbsUp, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Users, 
  Landmark, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

export default function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = (isMounted = true) => {
    if (isMounted) setIsLoading(true);
    api.get(`/profile/${id}`)
      .then(({ data }) => {
        if (!isMounted) return;
        setProfile(data.data);
        setPosts(data.posts ?? []);
      })
      .catch(() => {
        if (isMounted) setError('Profile could not be loaded.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    fetchProfile(isMounted);
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSyncLinkedIn = async () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to LinkedIn secure API...');
    
    // Premium multi-stage sync experience simulator
    setTimeout(() => {
      setSyncStatus('Retrieving certified work credentials & education timeline...');
      
      setTimeout(() => {
        setSyncStatus('Calculating mutual connection clusters...');
        
        setTimeout(async () => {
          try {
            const { data } = await api.post('/profile/sync-linkedin');
            setProfile(data.data);
            toast.success(data.message || 'LinkedIn credentials synchronized!');
          } catch (err) {
            toast.error('Sync failed. Please try again.');
          } finally {
            setIsSyncing(false);
            setSyncStatus('');
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAEAEA]">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF5C00]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#EAEAEA] px-4 pt-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-white p-6 text-red-600 font-bold shadow-sm">{error}</div>
      </main>
    );
  }

  const isOwner = currentUser?.id === profile.id;

  return (
    <main className="min-h-screen bg-[#EAEAEA] pb-12 text-[#111111]">
      {/* Profile Info Header */}
      <section className="border-b border-black/5 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start lg:px-8">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#FF5C00]/10 text-3xl font-bold text-[#FF5C00] border-2 border-[#FF5C00]/20 shadow-inner">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" /> : initials(profile.name)}
            </div>
            {profile.is_linkedin_verified && (
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white border-2 border-white shadow" title="LinkedIn Verified Credentials">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#FF5C00]/10 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-[#FF5C00]">
                {profile.role}
              </span>
              
              {/* Trust Badges */}
              {profile.is_linkedin_verified && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                  <ShieldCheck className="h-3 w-3" /> LinkedIn Verified
                </span>
              )}
              {profile.is_angellist_verified && (
                <span className="inline-flex items-center gap-1 rounded bg-black text-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  <ShieldCheck className="h-3 w-3" /> Wellfound Verified
                </span>
              )}
              {profile.is_crunchbase_verified && (
                <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wide">
                  <ShieldCheck className="h-3 w-3" /> Crunchbase
                </span>
              )}
            </div>

            <h1 className="mt-2 text-4xl font-display font-black text-[#111111] uppercase tracking-tight flex flex-wrap items-center gap-3">
              {profile.name}
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-gray-500">
              {profile.bio || 'This member has not added a bio yet.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#F4F4F4] border border-black/5 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-black/5 transition-all">
                    <BriefcaseBusiness className="h-4 w-4 text-gray-400" /> LinkedIn
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#F4F4F4] border border-black/5 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-black/5 transition-all">
                    <Code2 className="h-4 w-4" /> GitHub
                  </a>
                )}
                {!isOwner && (
                  <Link to={`/messages?user=${profile.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#FF5C00] hover:bg-[#E65300] shadow-md shadow-[#FF5C00]/15 px-5 py-2 text-xs font-bold text-white transition-all">
                    <MessageSquare className="h-4 w-4" /> Message
                  </Link>
                )}
              </div>

              {/* LinkedIn Sync Simulation Control */}
              {isOwner && (
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncLinkedIn}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 text-xs shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {profile.is_linkedin_verified ? 'Sync LinkedIn Credentials' : '🔗 Link LinkedIn Profile'}
                  </button>
                  {isSyncing && (
                    <span className="text-[10px] font-bold text-blue-600 animate-pulse uppercase tracking-wider">{syncStatus}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Split Grid */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Side Info Panel */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Founder Scorecard Card */}
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Award className="h-4 w-4 text-[#FF5C00]" /> Founder Scorecard
              </h3>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-[#F8F9FA] p-2 border border-black/5">
                  <p className="text-xl font-display font-black text-[#FF5C00]">{profile.scorecard_wins ?? 0}</p>
                  <p className="text-[9px] font-black uppercase text-gray-400 mt-0.5">Wins</p>
                </div>
                <div className="rounded-xl bg-[#F8F9FA] p-2 border border-black/5">
                  <p className="text-xl font-display font-black text-gray-800">{profile.scorecard_exits ?? 0}</p>
                  <p className="text-[9px] font-black uppercase text-gray-400 mt-0.5">Exits</p>
                </div>
                <div className="rounded-xl bg-[#F8F9FA] p-2 border border-black/5">
                  <p className="text-xl font-display font-black text-[#FF5C00]">{profile.scorecard_collabs ?? 0}</p>
                  <p className="text-[9px] font-black uppercase text-gray-400 mt-0.5">Collabs</p>
                </div>
              </div>
            </div>

            {/* Expertise Skills Cloud */}
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Skills & Expertise
              </h3>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="rounded-md bg-gray-100 border border-black/5 px-2.5 py-1 text-xs font-bold text-gray-700">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-gray-400">Sync profile to list founder skills.</p>
              )}
            </div>

            {/* Mutual Connections Check */}
            {profile.mutual_connections_count > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800">{profile.mutual_connections_count} Mutual Connections</p>
                  <p className="text-[10px] font-semibold text-blue-600/70">Verified through mutual LinkedIn networks.</p>
                </div>
              </div>
            )}

          </div>

          {/* Main Feed/Timeline Panel */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Professional Timeline */}
            {profile.linkedin_credentials && profile.linkedin_credentials.length > 0 && (
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-[#FF5C00]" /> LinkedIn Professional Experience
                </h3>
                
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                  {profile.linkedin_credentials.map((job, idx) => (
                    <div key={idx} className="relative pl-7 group">
                      <div className="absolute left-[7px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow group-hover:scale-110 transition-transform" />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-sm font-black text-[#111111]">{job.role}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{job.duration}</span>
                      </div>
                      <p className="text-xs font-bold text-[#FF5C00] mt-0.5">{job.company}</p>
                      <p className="text-xs font-semibold text-gray-500 mt-1 leading-relaxed">{job.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pitches List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-black text-[#111111] uppercase tracking-tight">Published Pitches</h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{posts.length} visible</span>
              </div>
              
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-black/5 bg-white p-8 text-center font-semibold text-gray-400 shadow-sm">No published pitches yet.</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {posts.map((post) => (
                    <Link key={post.id} to={`/pitches/${post.id}`} className="block rounded-xl border border-black/5 bg-white p-5 transition hover:border-[#FF5C00]/30 shadow-sm">
                      <div className="mb-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-[#FF5C00]/10 px-2 py-0.5 font-bold text-[#FF5C00] uppercase tracking-wide">{post.industry}</span>
                        <span className="rounded-md bg-black/5 px-2 py-0.5 font-bold text-gray-500 uppercase tracking-wide">{formatStage(post.funding_stage)}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#111111] leading-snug line-clamp-1">{post.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-gray-400">{post.tagline}</p>
                      <div className="mt-4 flex gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-[#FF5C00]" /> {numberCompact(post.weighted_score ?? post.upvotes_count)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-gray-400" /> {numberCompact(post.comments_count)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </section>
    </main>
  );
}
