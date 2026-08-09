import React from 'react';
import TopNav from './TopNav';
import Toast from './Toast';

export default function AppShell({ children, activeTab, setActiveTab, isAuthenticated, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main
        style={{
          flex: 1,
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '1.75rem 1.25rem 3rem 1.25rem',
          /* clip (not hidden) prevents horizontal scrollbar without trapping
             overflow:visible descendants (e.g. 3-D book drop-shadows) */
          overflowX: 'clip',
        }}
      >
        {children}
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-glass)',
          backgroundColor: 'var(--bg-surface)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          marginTop: 'auto',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Cover Doctor Studio</strong> • Quantitative Book Cover Scoring & Diagnostic Architecture
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <button onClick={() => setActiveTab && setActiveTab('workflows')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              Workflows & Guides
            </button>
            <button onClick={() => setActiveTab && setActiveTab('help')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              Help & FAQ
            </button>
            <button onClick={() => setActiveTab && setActiveTab('pricing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              Pricing & Plans
            </button>
          </div>
        </div>
      </footer>

      <Toast />
    </div>
  );
}
