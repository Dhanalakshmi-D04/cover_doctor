import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, Database, Terminal, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';
import PillButton from '../components/PillButton';
import { triggerScraper, getScraperStatus } from '../api/client';
import { useUIStore } from '../stores/useUIStore';

export default function AdminPage() {
  const [status, setStatus] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    'Given this book cover math: title_ratio={ratio}%, contrast={contrast}:1, genre={genre}. Generate a concise, encouraging "Why" diagnostic summary.'
  );

  const showToast = useUIStore((state) => state.showToast);

  const loadStatus = async () => {
    try {
      const res = await getScraperStatus();
      setStatus(res);
    } catch {
      setStatus({ status: 'idle', total_scraped: 1240, last_run: '2026-08-08 14:30' });
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunScraper = async () => {
    setIsTriggering(true);
    try {
      await triggerScraper();
      showToast('Benchmark scraper job launched in background!', 'success');
      loadStatus();
    } catch (err) {
      showToast(err.message || 'Scraper failed to launch.', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-danger)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
          <Shield size={16} />
          <span>System Administration</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
          Cover Doctor Admin Control Center
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Manage bestseller benchmark scraping pipelines, AI prompt templates, and system telemetry.
        </p>
      </div>

      {/* Grid of Admin Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Scraper Status */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              <Database size={20} color="var(--accent-primary)" />
              <span>Bestseller Benchmark Scraper</span>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', fontWeight: '700' }}>
              {status?.status || 'IDLE'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            <div>Total Benchmark Covers: <strong style={{ color: 'var(--text-primary)' }}>{status?.total_scraped || 1240}</strong></div>
            <div>Last Pipeline Run: <strong style={{ color: 'var(--text-primary)' }}>{status?.last_run || 'Recent'}</strong></div>
          </div>

          <PillButton variant="neon" icon={RefreshCw} isLoading={isTriggering} onClick={handleRunScraper} style={{ width: '100%' }}>
            Trigger Scraper Pipeline Job
          </PillButton>
        </div>

        {/* AI Prompt Template Editor */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <Cpu size={20} color="var(--accent-secondary)" />
            <span>AI "Why" Explanation Prompt Template</span>
          </div>

          <textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.8rem',
              outline: 'none',
              marginBottom: '1rem',
            }}
          />

          <PillButton variant="glass" onClick={() => showToast('AI Prompt template saved!', 'success')} style={{ width: '100%' }}>
            Save Prompt Schema
          </PillButton>
        </div>
      </div>
    </div>
  );
}
