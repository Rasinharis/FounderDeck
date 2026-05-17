import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { getMyPosts } from '../../api/posts';
import { numberCompact, formatStage } from '../../lib/format';
import {
  Handshake,
  MessageSquare,
  Plus,
  Presentation,
  ThumbsUp,
  TrendingUp,
  Globe,
  Sparkles,
  Eye,
  ArrowUpRight,
  TrendingDown,
  Flame,
  Snowflake,
  Heart,
} from 'lucide-react';

export default function EntrepreneurOverview() {
  const [posts, setPosts] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    Promise.all([
      getMyPosts({ per_page: 6 }),
      api.get('/collab/received'),
      api.get('/bookmarks'),
    ]).then(([postResponse, collabResponse, bookmarkResponse]) => {
      setPosts(postResponse.data.data ?? []);
      setCollabs(collabResponse.data.data ?? []);
      setBookmarks(bookmarkResponse.data.data ?? []);
    }).catch(() => {
      setPosts([]);
      setCollabs([]);
      setBookmarks([]);
    });
  }, []);

  const totalUpvotes = posts.reduce((sum, post) => sum + (post.upvotes_count ?? 0), 0);
  const totalDownvotes = posts.reduce((sum, post) => sum + (post.downvotes_count ?? 0), 0);
  const totalVotes = totalUpvotes - totalDownvotes;
  const totalComments = posts.reduce((sum, post) => sum + (post.comments_count ?? 0), 0);
  const totalViews = posts.reduce((sum, post) => sum + (post.views_count ?? 0), 0);
  const pendingCollabs = collabs.filter((item) => item.status === 'pending').length;

  // Calculate vote percentage breakdown for SVG ring
  const totalVoteCount = totalUpvotes + totalDownvotes;
  const upvotePercent = totalVoteCount > 0 ? Math.round((totalUpvotes / totalVoteCount) * 100) : 100;
  const downvotePercent = totalVoteCount > 0 ? Math.round((totalDownvotes / totalVoteCount) * 100) : 0;
  
  // SVG donut metrics (Circumference = 2 * PI * r)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (upvotePercent / 100) * circumference;

  return (
    <div className="space-y-6 text-[#111111]">
      
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-[#111111] uppercase tracking-tight flex items-center gap-2">
            Founder Dashboard <Sparkles className="h-6 w-6 text-[#FF5C00]" />
          </h1>
          <p className="mt-1 text-sm font-semibold text-gray-500">Track pitch traction, geographic interest, and investor engagement.</p>
        </div>
        <Link to="/dashboard/entrepreneur/pitches/new" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF5C00] hover:bg-[#E65300] px-5 py-2.5 font-bold text-white transition-all shadow-md shadow-[#FF5C00]/15 hover:scale-[1.02]">
          <Plus className="h-4 w-4" /> New Pitch
        </Link>
      </div>

      {/* Basic Stat Counters */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Stat icon={Presentation} label="Pitches Published" value={posts.length} />
        <Stat icon={ThumbsUp} label="Net Votes Score" value={numberCompact(totalVotes)} />
        <Stat icon={MessageSquare} label="Total Comments" value={numberCompact(totalComments)} />
        <Stat icon={Handshake} label="Active Collabs" value={numberCompact(collabs.length)} />
      </div>

      {/* ── HIGH FIDELITY CREATOR ANALYTICS CENTER ────────────────── */}
      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-black/5 pb-2 overflow-x-auto gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'performance' ? 'border-[#FF5C00] text-[#FF5C00]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            📊 Pitch Performance
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('geographic')}
            className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'geographic' ? 'border-[#FF5C00] text-[#FF5C00]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🌍 Investor Geographic Reach
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'trends' ? 'border-[#FF5C00] text-[#FF5C00]' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            🔥 Platform Trends
          </button>
        </div>

        {/* Tab 1: Performance */}
        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Conversion Funnel */}
            <div className="md:col-span-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Traction Conversion Funnel</h3>
              
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 uppercase mb-1">
                    <span>1. Pitch Views</span>
                    <span>{totalViews} views</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 uppercase mb-1">
                    <span>2. Feedback Engagement</span>
                    <span>{totalComments} comments ({totalViews > 0 ? Math.round((totalComments / totalViews) * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF5C00] rounded-full" style={{ width: `${totalViews > 0 ? Math.min((totalComments / totalViews) * 100, 100) : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 uppercase mb-1">
                    <span>3. Investor Connections</span>
                    <span>{collabs.length} inquiries ({totalViews > 0 ? Math.round((collabs.length / totalViews) * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalViews > 0 ? Math.min((collabs.length / totalViews) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Ring breakdown */}
            <div className="md:col-span-6 flex flex-col sm:flex-row items-center gap-6 justify-center border-l border-black/5 pl-0 md:pl-8">
              <div className="relative h-28 w-28 shrink-0">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 96 96">
                  {/* Background ring */}
                  <circle
                    className="text-gray-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                  />
                  {/* Active Upvotes ring */}
                  <circle
                    className="text-[#FF5C00]"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="48"
                    cy="48"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-display font-black text-gray-900">{upvotePercent}%</span>
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Upvoted</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Community validation metrics</h4>
                <div className="space-y-1 text-sm font-semibold">
                  <p className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5C00]" />
                    <span className="text-gray-500">{totalUpvotes} Upvotes</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
                    <span className="text-gray-500">{totalDownvotes} Downvotes</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Geographic Reach */}
        {activeTab === 'geographic' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Glowing Map Component */}
            <div className="md:col-span-8 bg-gray-50 rounded-2xl border border-black/5 p-4 relative flex items-center justify-center overflow-hidden">
              
              {/* High-fidelity Inline Custom World Map */}
              <svg className="w-full max-h-[220px]" viewBox="0 0 1000 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Simplified Continents outlines */}
                <path d="M150 120 C180 80, 250 100, 280 150 C300 200, 240 260, 200 320 C180 340, 140 280, 130 250 Z" fill="#E2E8F0" />
                <path d="M400 130 C450 110, 520 120, 550 160 C580 200, 520 280, 480 320 C450 350, 420 300, 410 240 Z" fill="#CBD5E1" />
                <path d="M620 180 C680 150, 750 160, 780 200 C800 240, 740 310, 710 340 C680 360, 650 300, 630 250 Z" fill="#E2E8F0" />
                <path d="M800 280 C840 270, 880 290, 890 310 C900 340, 860 380, 830 390 Z" fill="#CBD5E1" />

                {/* Glowing Silicon Valley Pin */}
                <g className="animate-pulse">
                  <circle cx="210" cy="160" r="10" fill="#FF5C00" opacity="0.3" />
                  <circle cx="210" cy="160" r="5" fill="#FF5C00" />
                </g>
                <text x="210" y="145" fill="#111111" fontSize="11" fontWeight="bold" textAnchor="middle">Silicon Valley</text>

                {/* Glowing London Pin */}
                <g className="animate-pulse">
                  <circle cx="480" cy="150" r="10" fill="#FF5C00" opacity="0.3" />
                  <circle cx="480" cy="150" r="5" fill="#FF5C00" />
                </g>
                <text x="480" y="135" fill="#111111" fontSize="11" fontWeight="bold" textAnchor="middle">London</text>

                {/* Glowing Tokyo Pin */}
                <g className="animate-pulse">
                  <circle cx="760" cy="220" r="10" fill="#FF5C00" opacity="0.3" />
                  <circle cx="760" cy="220" r="5" fill="#FF5C00" />
                </g>
                <text x="760" y="205" fill="#111111" fontSize="11" fontWeight="bold" textAnchor="middle">Tokyo</text>

                {/* Glowing Singapore Pin */}
                <g className="animate-pulse">
                  <circle cx="710" cy="290" r="10" fill="#FF5C00" opacity="0.3" />
                  <circle cx="710" cy="290" r="5" fill="#FF5C00" />
                </g>
                <text x="710" y="275" fill="#111111" fontSize="11" fontWeight="bold" textAnchor="middle">Singapore</text>
              </svg>
            </div>

            {/* Geographic connections breakdown */}
            <div className="md:col-span-4 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Investor Geo Distribution</h3>
              <div className="space-y-3.5 text-xs font-bold text-gray-700 uppercase">
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span>🇺🇸 North America</span>
                  <span className="rounded bg-gray-950 px-2 py-0.5 text-white">48%</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span>🇪🇺 Europe & UK</span>
                  <span className="rounded bg-gray-950 px-2 py-0.5 text-white">28%</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-black/5">
                  <span>🇯🇵 Japan & East Asia</span>
                  <span className="rounded bg-gray-950 px-2 py-0.5 text-white">14%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>🇸🇬 Southeast Asia</span>
                  <span className="rounded bg-gray-950 px-2 py-0.5 text-white">10%</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Platform Trends */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Interactive Trend Reports - What's Hot & Dying?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sector 1: Hot */}
              <div className="rounded-xl border border-green-500/20 bg-green-50/50 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold uppercase text-green-700">
                    <Flame className="h-3.5 w-3.5 fill-current" /> Hot Sector
                  </span>
                  <span className="text-xs font-bold text-green-600">+148% Vol</span>
                </div>
                <h4 className="text-base font-display font-black text-gray-900">Generative AI SaaS</h4>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Investors are actively filtering for startups with pre-integrated workflows. Upvoting rates for AI category are peak.
                </p>
              </div>

              {/* Sector 2: Hot */}
              <div className="rounded-xl border border-green-500/20 bg-green-50/50 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold uppercase text-green-700">
                    <Flame className="h-3.5 w-3.5 fill-current" /> Hot Sector
                  </span>
                  <span className="text-xs font-bold text-green-600">+82% Vol</span>
                </div>
                <h4 className="text-base font-display font-black text-gray-900">B2B Developer Tools</h4>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Strong rise in investor direct inquiries and code review integrations.
                </p>
              </div>

              {/* Sector 3: Cold */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold uppercase text-blue-700">
                    <Snowflake className="h-3.5 w-3.5" /> Cool Sector
                  </span>
                  <span className="text-xs font-bold text-blue-600">-32% Vol</span>
                </div>
                <h4 className="text-base font-display font-black text-gray-900">Web3 NFT Social Networks</h4>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Traction metrics are lower. Investors suggest focusing on real-world asset tokenization (RWA) utility.
                </p>
              </div>

              {/* Sector 4: Cold */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold uppercase text-blue-700">
                    <Snowflake className="h-3.5 w-3.5" /> Cool Sector
                  </span>
                  <span className="text-xs font-bold text-blue-600">-18% Vol</span>
                </div>
                <h4 className="text-base font-display font-black text-gray-900">AdTech Platforms</h4>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                  Pure advertising networks show lower engagement. Match activity suggests combining with first-party AI data tools.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Recent Pitches List */}
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-[#111111]">Recent pitches</h2>
          <Link to="/dashboard/entrepreneur/pitches" className="text-sm font-bold text-[#FF5C00] hover:text-[#E65300] transition-colors">Manage all</Link>
        </div>
        {posts.length === 0 ? (
          <p className="rounded-xl bg-[#F4F4F4] p-4 text-sm font-semibold text-gray-500">Create your first pitch to start collecting validation.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {posts.slice(0, 4).map((post) => (
              <Link key={post.id} to={`/pitches/${post.id}`} className="rounded-xl border border-black/5 bg-[#F4F4F4] p-4 transition-all hover:border-[#FF5C00]/40 hover:bg-white hover:shadow-sm">
                <h3 className="font-display font-bold text-[#111111]">{post.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-500">{post.tagline}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Saved Bookmarks Section */}
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-display font-black text-[#111111] uppercase tracking-tight flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" /> Bookmarked & Saved Pitches
          </h2>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{bookmarks.length} saved</span>
        </div>
        {bookmarks.length === 0 ? (
          <p className="rounded-xl bg-[#F4F4F4] p-5 text-xs font-bold text-gray-400 italic text-center">
            No saved pitches yet. Browse the pitches explorer to bookmark promising startups!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bookmarks.map((bookmark) => {
              const pitchItem = bookmark.post;
              if (!pitchItem) return null;
              return (
                <Link key={pitchItem.id} to={`/pitches/${pitchItem.id}`} className="block rounded-xl border border-black/5 bg-[#F4F4F4] p-4 transition-all hover:border-red-500/30 hover:bg-white hover:shadow-sm">
                  <div className="mb-2 flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-wider">
                    <span className="rounded bg-[#FF5C00]/10 px-2.5 py-0.5 text-[#FF5C00]">{pitchItem.industry}</span>
                    <span className="rounded bg-gray-950 px-2.5 py-0.5 text-white">{formatStage(pitchItem.funding_stage)}</span>
                  </div>
                  <h3 className="font-display font-bold text-[#111111] line-clamp-1">{pitchItem.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-400">{pitchItem.tagline}</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-[#FF5C00]/10 text-[#FF5C00] p-2.5 transition-colors group-hover:bg-[#FF5C00] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-display font-black text-[#111111]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-gray-500">{label}</p>
    </div>
  );
}
