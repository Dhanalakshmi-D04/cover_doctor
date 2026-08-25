import React, { useState, useEffect } from 'react';
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

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [coverId, setCoverId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isBillingSuccess, setIsBillingSuccess] = useState(window.location.pathname.startsWith('/billing/success'));
  const [backendError, setBackendError] = useState(false);

  const fetchAccount = useAuthStore((state) => state.fetchAccount);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        await getMe();
        if (mounted) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (mounted) {
          // If it's explicitly a 401 Unauthorized, they are logged out.
          // Otherwise, it might be a 502/network error.
          if (err.message && err.message.includes('Failed to fetch')) {
            // Leave them in an error state instead of logging them out
            setBackendError(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    checkAuth();

    function handleUnauthorized() {
      setIsAuthenticated(false);
      setCoverId(null);
    }
    window.addEventListener('auth_unauthorized', handleUnauthorized);

    const hash = window.location.hash.replace('#', '');
    const validTabs = ['explore', 'ab-test', 'palette-studio', 'export', 'account', 'pricing', 'workflows', 'help', 'admin'];
    if (validTabs.includes(hash)) {
      setActiveTab(hash);
    }

    return () => {
      mounted = false;
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccount();
    }
  }, [isAuthenticated, fetchAccount]);


  function handleTabChange(tab) {
    if (tab === 'home' && activeTab === 'home' && coverId) {
      setCoverId(null);
    }
    setActiveTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
  }

  async function handleLogout() {
    await logout().catch(() => {});
    setIsAuthenticated(false);
    setCoverId(null);
  }

  function handleBillingSuccessNavigateHome() {
    window.history.replaceState({}, document.title, '/');
    setIsBillingSuccess(false);
    setActiveTab('home');
  }

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
        {/* Simple loading state while we probe the backend for the HttpOnly cookie */}
        <div style={{ color: 'var(--theme-text-muted)' }}>Loading...</div>
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

  if (isBillingSuccess) {
    return (
      <AppShell activeTab="home" setActiveTab={handleTabChange} isAuthenticated={isAuthenticated} onLogout={handleLogout}>
        <BillingSuccess 
          onNavigateHome={handleBillingSuccessNavigateHome}
          onUploaded={(id) => { setCoverId(id); handleBillingSuccessNavigateHome(); }} 
        />
      </AppShell>
    );
  }

  // Item 7: Unknown route fallback
  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return coverId ? (
          // Item 2: Report-specific error boundary
          <ErrorBoundary onReset={() => setCoverId(null)}>
            <Report coverId={coverId} onReset={() => setCoverId(null)} onNavigate={handleTabChange} />
          </ErrorBoundary>
        ) : (
          <Home onUploaded={setCoverId} onNavigate={handleTabChange} />
        );
      case 'explore': return <BestsellerExplorer userCoverId={coverId} />;
      case 'ab-test': return <ABTestStudio />;
      case 'palette-studio': return <ColorPaletteStudio />;
      case 'export': return <ExportStudio />;
      case 'account': return <Account onNavigate={handleTabChange} />;
      case 'pricing': return <Pricing />;
      case 'workflows': return <WorkflowsPage onNavigate={handleTabChange} />;
      case 'help': return <HelpPage />;
      case 'admin': return <AdminPage />;
      default:
        // Fallback for unknown hashes
        return (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <h2>Page Not Found</h2>
            <p>The page you are looking for doesn't exist.</p>
            <button className="link-button" onClick={() => handleTabChange('home')} style={{ marginTop: '1rem' }}>
              Return to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={handleTabChange} isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      {/* Item 2: Top-level ErrorBoundary wrapping all main content */}
      <ErrorBoundary>
        {renderTab()}
      </ErrorBoundary>
    </AppShell>
  );
}

export default App;
