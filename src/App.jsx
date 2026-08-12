import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Shell from '@/components/shell/Shell';
import Overview from '@/pages/Overview';
import Feed from '@/pages/Feed';
import Sources from '@/pages/Sources';
import SourceDashboard from '@/pages/SourceDashboard';
import Reports from '@/pages/Reports';
import Forecast from '@/pages/Forecast';
import Ops from '@/pages/Ops';

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors.
  // Keep auth pages reachable even when a stale token is present; the
  // protected routes handle redirecting authenticated-only screens.
  const authPagePaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authPagePaths.includes(location.pathname);

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === 'auth_required' && !isAuthPage) {
    // Redirect to login automatically
    navigateToLogin();
    return null;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Shell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/sources/:slug" element={<SourceDashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/admin" element={<Ops />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App