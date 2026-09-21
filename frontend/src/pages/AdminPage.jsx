import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, Database, Cpu } from 'lucide-react';
import PillButton from '../components/PillButton';
import { triggerScraper, getScraperStatus } from '../api/client';
import { useUIStore } from '../stores/useUIStore';

export default function AdminPage() {
  const [status, setStatus] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    'Given this book cover math: title_ratio={ratio}%, contrast={contrast}:1, genre={genre}. Generate a concise, encouraging "Why" diagnostic summary.'
  );
  const pollRef = useRef(null);
  const showToast = useUIStore((state) => state.showToast);

  const loadStatus = async () => {
    try {
      const res = await getScraperStatus();
      setStatus(res);
      return res;
    } catch {
      setStatus({ status: 'unknown', total_scraped: null });
      return null;
    }
  };

  // Start polling every 2s when running, stop when idle
  const startPolling = () => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      const res = await loadStatus();
      if (res && !res.is_running) {
        stopPolling();
        showToast(`Scraper finished! Total covers: ${res.total_scraped}`, 'success');
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    loadStatus().then((res) => {
      // If server restarted mid-run, resume polling
      if (res?.is_running) startPolling();
    });
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunScraper = async () => {
    setIsTriggering(true);
    try {
      await triggerScraper();
      showToast('Scraper launched! Watch live progress below.', 'success');
      await loadStatus(); // get initial running state
      startPolling();
    } catch (err) {
      showToast(err.message || 'Scraper failed to launch.', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  const isRunning = status?.is_running;
  const progress = status?.progress;

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
        <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              <Database size={20} color="var(--accent-primary)" />
              <span>Bestseller Benchmark Scraper</span>
            </div>
            <span style={{
              fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
              backgroundColor: isRunning ? 'rgba(234,179,8,0.15)' : 'rgba(16,185,129,0.15)',
              color: isRunning ? '#ca8a04' : 'var(--accent-success)', fontWeight: '700', textTransform: 'uppercase',
            }}>
              {isRunning ? 'Running' : (status?.status || 'Idle')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            <div>Total Benchmark Covers: <strong style={{ color: 'var(--text-primary)' }}>{status?.total_scraped ?? '—'}</strong></div>

            {/* Live progress section — only visible while running */}
            {isRunning && progress && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  📡 <strong style={{ color: 'var(--text-primary)' }}>{progress.current_style}</strong>
                  {' — '}{progress.current_action}
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', borderRadius: '999px', backgroundColor: 'var(--border-glass)', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${progress.percent_complete}%` }}
                    transition={{ duration: 0.5 }}
                    style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Processed: <strong style={{ color: 'var(--text-primary)' }}>{progress.processed_covers}</strong> / {progress.total_covers}</span>
                  <span>Saved: <strong style={{ color: 'var(--accent-success)' }}>{progress.inserted_covers}</strong></span>
                  {progress.error_count > 0 && <span style={{ color: 'var(--accent-danger)' }}>Errors: {progress.error_count}</span>}
                  <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{progress.percent_complete}%</span>
                </div>
              </motion.div>
            )}

            {/* Style breakdown — shown when idle */}
            {!isRunning && status?.by_style && status.by_style.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>By Style</div>
                {status.by_style.map((row) => (
                  <div key={row.style} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                    <span>{row.style}</span>
                    <strong style={{ color: 'var(--accent-primary)' }}>{row.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <PillButton
            variant="neon"
            icon={RefreshCw}
            isLoading={isTriggering || isRunning}
            onClick={handleRunScraper}
            style={{ width: '100%' }}
            disabled={isRunning}
          >
            {isRunning ? 'Scraper Running...' : 'Trigger Scraper Pipeline Job'}
          </PillButton>
        </div>

        {/* AI Prompt Template Editor */}
        <div style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-glass-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <Cpu size={20} color="var(--accent-secondary)" />
            <span>AI "Why" Explanation Prompt Template</span>
          </div>

          <textarea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', fontFamily: 'var(--font-family-mono)', fontSize: '0.8rem', outline: 'none', marginBottom: '1rem' }}
          />

          <PillButton variant="glass" onClick={() => showToast('AI Prompt template saved!', 'success')} style={{ width: '100%' }}>
            Save Prompt Schema
          </PillButton>
        </div>
      </div>
    </div>
  );
}

