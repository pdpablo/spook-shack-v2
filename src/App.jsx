import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";

const PageNotFound = lazy(() => import("./lib/PageNotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Shell = lazy(() => import("@/components/shell/Shell"));
const Overview = lazy(() => import("@/pages/Overview"));
const Feed = lazy(() => import("@/pages/Feed"));
const Sources = lazy(() => import("@/pages/Sources"));
const SourceDashboard = lazy(() => import("@/pages/SourceDashboard"));
const Reports = lazy(() => import("@/pages/Reports"));
const Forecast = lazy(() => import("@/pages/Forecast"));
const Ops = lazy(() => import("@/pages/Ops"));

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  // Handle authentication errors.
  // Keep auth pages reachable even when a stale token is present; the
  // protected routes handle redirecting authenticated-only screens.
  const authPagePaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthPage = authPagePaths.includes(location.pathname);

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === "auth_required" && !isAuthPage) {
    // Redirect to login automatically
    navigateToLogin();
    return null;
  }

  // Render the main app
  return (
    <Suspense fallback={<LoadingScreen />}>
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
    </Suspense>
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