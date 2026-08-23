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
import { logout, getMe } from './api/client';
import { useAuthStore } from './stores/useAuthStore';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [coverId, setCoverId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isBillingSuccess, setIsBillingSuccess] = useState(window.location.pathname.startsWith('/billing/success'));

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
          setIsAuthenticated(false);
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

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
        <Auth onAuthenticated={() => setIsAuthenticated(true)} />
      </div>
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

  return (
    <AppShell activeTab={activeTab} setActiveTab={handleTabChange} isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      {activeTab === 'home' && (
        coverId ? (
          <Report coverId={coverId} onReset={() => setCoverId(null)} onNavigate={handleTabChange} />
        ) : (
          <Home onUploaded={setCoverId} onNavigate={handleTabChange} />
        )
      )}
      {activeTab === 'explore' && <BestsellerExplorer userCoverId={coverId} />}
      {activeTab === 'ab-test' && <ABTestStudio />}
      {activeTab === 'palette-studio' && <ColorPaletteStudio />}
      {activeTab === 'export' && <ExportStudio />}
      {activeTab === 'account' && <Account onNavigate={handleTabChange} />}
      {activeTab === 'pricing' && <Pricing />}
      {activeTab === 'workflows' && <WorkflowsPage onNavigate={handleTabChange} />}
      {activeTab === 'help' && <HelpPage />}
      {activeTab === 'admin' && <AdminPage />}
    </AppShell>
  );
}

export default App;
