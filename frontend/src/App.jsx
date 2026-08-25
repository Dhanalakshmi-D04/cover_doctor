import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Report from './pages/Report';
import BestsellerExplorer from './pages/BestsellerExplorer';
import ABTestStudio from './pages/ABTestStudio';
import ColorPaletteStudio from './pages/ColorPaletteStudio';
import ExportStudio from './pages/ExportStudio';
import Account from './pages/Account';
import Pricing from './pages/Pricing';
import WorkflowsPage from './pages/WorkflowsPage';
import HelpPage from './pages/HelpPage';
import AdminPage from './pages/AdminPage';
import BillingSuccess from './pages/BillingSuccess';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import { logout, getMe } from './api/client';
import { useAuthStore } from './stores/useAuthStore';

// ─── Route path map ───────────────────────────────────────────────────────────
// Maps the old tab-id strings to URL paths so every onNavigate('explore') call
// can be trivially converted to navigate('/explore').
export const TAB_PATHS = {
  home: '/',
  explore: '/explore',
  'ab-test': '/ab-test',
  'palette-studio': '/palette-studio',
  export: '/export',
  account: '/account',
  pricing: '/pricing',
  workflows: '/workflows',
  help: '/help',
  admin: '/admin',
};

// ─── Inner app (must live inside <BrowserRouter> so hooks work) ───────────────
function AppInner() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [coverId, setCoverId] = useState(null);
  const [backendError, setBackendError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const fetchAccount = useAuthStore((state) => state.fetchAccount);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        await getMe();
        if (mounted) setIsAuthenticated(true);
      } catch (err) {
        if (mounted) {
          if (err.message && err.message.includes('Failed to fetch')) {
            setBackendError(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    checkAuth();

    function handleUnauthorized() {
      setIsAuthenticated(false);
      setCoverId(null);
    }
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => {
      mounted = false;
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchAccount();
  }, [isAuthenticated, fetchAccount]);

  // Derive active tab from the current URL path for TopNav highlighting
  const activeTab = (() => {
    const path = location.pathname;
    for (const [tab, tabPath] of Object.entries(TAB_PATHS)) {
      if (tabPath !== '/' && path.startsWith(tabPath)) return tab;
    }
    return 'home';
  })();

  // Unified navigation helper — accepts a tab id or a full path
  function handleTabChange(tabOrPath) {
    const path = TAB_PATHS[tabOrPath] ?? tabOrPath;
    // Special case: clicking "home" while on home clears the report
    if ((tabOrPath === 'home' || tabOrPath === '/') && location.pathname === '/') {
      setCoverId(null);
      return;
    }
    navigate(path);
  }

  async function handleLogout() {
    await logout().catch(() => {});
    setIsAuthenticated(false);
    setCoverId(null);
    navigate('/');
  }

  function handleBillingSuccessNavigateHome() {
    setCoverId(null);
    navigate('/');
  }

  // ── Loading / error states ──────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ color: 'var(--theme-text-muted)' }}>Loading…</div>
      </div>
    );
  }

  if (backendError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-app)', textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Can't reach the server</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please check your internet connection or try again later.</p>
        <button className="pill-button" onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
          <Auth onAuthenticated={() => setIsAuthenticated(true)} />
        </div>
      </ErrorBoundary>
    );
  }

  // ── Authenticated app shell with routes ────────────────────────────────────
  return (
    <AppShell activeTab={activeTab} setActiveTab={handleTabChange} isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      <ErrorBoundary>
        <Routes>
          {/* Home / Report */}
          <Route
            path="/"
            element={
              coverId ? (
                <ErrorBoundary onReset={() => setCoverId(null)}>
                  <Report coverId={coverId} onReset={() => setCoverId(null)} onNavigate={handleTabChange} />
                </ErrorBoundary>
              ) : (
                <Home onUploaded={setCoverId} onNavigate={handleTabChange} />
              )
            }
          />

          {/* Feature pages */}
          <Route path="/explore" element={<BestsellerExplorer userCoverId={coverId} />} />
          <Route path="/ab-test" element={<ABTestStudio />} />
          <Route path="/palette-studio" element={<ColorPaletteStudio />} />
          <Route path="/export" element={<ExportStudio />} />
          <Route path="/account" element={<Account onNavigate={handleTabChange} />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/workflows" element={<WorkflowsPage onNavigate={handleTabChange} />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Post-checkout confirmation */}
          <Route
            path="/billing/success"
            element={
              <BillingSuccess
                onNavigateHome={handleBillingSuccessNavigateHome}
                onUploaded={(id) => { setCoverId(id); handleBillingSuccessNavigateHome(); }}
              />
            }
          />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <h2>Page Not Found</h2>
                <p>The page you are looking for doesn't exist.</p>
                <button className="link-button" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
                  Return to Dashboard
                </button>
              </div>
            }
          />
        </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
