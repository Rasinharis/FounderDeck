import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layouts
const EntrepreneurLayout = lazy(() => import('./pages/entrepreneur/EntrepreneurLayout'));
const InvestorLayout = lazy(() => import('./pages/investor/InvestorLayout'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Navbar = lazy(() => import('./components/layout/Navbar'));

// Route Wrappers
const ProtectedRoute = lazy(() => import('./components/layout/ProtectedRoute'));
const RoleRoute = lazy(() => import('./components/layout/RoleRoute'));
const GuestRoute = lazy(() => import('./components/layout/GuestRoute'));

// Public Pages
const Landing = lazy(() => import('./pages/public/Landing'));
const PitchFeed = lazy(() => import('./pages/public/PitchFeed'));
const PitchDetail = lazy(() => import('./pages/public/PitchDetail'));
const PublicProfile = lazy(() => import('./pages/public/PublicProfile'));

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'));
const Onboarding = lazy(() => import('./pages/auth/Onboarding'));

// Entrepreneur Pages
const EntrepreneurOverview = lazy(() => import('./pages/entrepreneur/EntrepreneurOverview'));
const MyPitches = lazy(() => import('./pages/entrepreneur/MyPitches'));
const PitchForm = lazy(() => import('./pages/entrepreneur/PitchForm'));
const CollabInbox = lazy(() => import('./pages/entrepreneur/CollabInbox'));

// Investor Pages
const InvestorOverview = lazy(() => import('./pages/investor/InvestorOverview'));
const SentCollabs = lazy(() => import('./pages/investor/SentCollabs'));

// Shared Pages
const Messages = lazy(() => import('./pages/shared/Messages'));
const Notifications = lazy(() => import('./pages/shared/Notifications'));

// Admin Pages
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#EAEAEA] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function MessagesRedirect() {
  const { user } = useAuthStore();
  const location = useLocation();
  const qs = location.search; // preserve ?user=... query params
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'entrepreneur') return <Navigate to={`/dashboard/entrepreneur/messages${qs}`} replace />;
  if (user.role === 'investor') return <Navigate to={`/dashboard/investor/messages${qs}`} replace />;
  // super_admin or unknown: fall back to a sensible default
  return <Navigate to="/" replace />;
}

export default function App() {
  const { hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Navbar />
      <div className="pt-16">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pitches" element={<PitchFeed />} />
          <Route path="/pitches/:id" element={<PitchDetail />} />
          <Route path="/profile/:id" element={<PublicProfile />} />

          {/* Auth Routes */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
          
          {/* Protected Common Routes */}
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          {/* /messages → redirect to role-appropriate dashboard messages */}
          <Route path="/messages" element={<ProtectedRoute><MessagesRedirect /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* Entrepreneur Dashboard */}
          <Route path="/dashboard/entrepreneur" element={<ProtectedRoute><RoleRoute allowedRole="entrepreneur"><EntrepreneurLayout /></RoleRoute></ProtectedRoute>}>
            <Route index element={<EntrepreneurOverview />} />
            <Route path="pitches" element={<MyPitches />} />
            <Route path="pitches/new" element={<PitchForm />} />
            <Route path="pitches/:id/edit" element={<PitchForm />} />
            <Route path="collabs" element={<CollabInbox />} />
            <Route path="messages" element={<Messages />} />
          </Route>

          {/* Investor Dashboard */}
          <Route path="/dashboard/investor" element={<ProtectedRoute><RoleRoute allowedRole="investor"><InvestorLayout /></RoleRoute></ProtectedRoute>}>
            <Route index element={<InvestorOverview />} />
            <Route path="collabs" element={<SentCollabs />} />
            <Route path="messages" element={<Messages />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><RoleRoute allowedRole="super_admin"><AdminLayout /></RoleRoute></ProtectedRoute>}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

        </Routes>
      </div>
    </Suspense>
  );
}
