import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, CheckCircle, AlertCircle } from 'lucide-react';
import { getUserPlan, uploadCover } from '../api/client';
import { loadPendingUpload, clearPendingUpload } from '../api/indexedDB';
import { createBookProject } from '../api/client';

export default function BillingSuccess({ onNavigateHome, onUploaded }) {
  const [status, setStatus] = useState('confirming'); // 'confirming', 'uploading', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let polling = true;
    let attempts = 0;

    async function pollWebhookAndRetryUpload() {
      // 1. Poll until backend reports plan is upgraded (not "free")
      while (polling && attempts < 15) {
        try {
          const acc = await getUserPlan();
          if (acc.plan !== 'free') {
            polling = false;
            break;
          }
        } catch (e) {
          // ignore network errors while polling
        }
        attempts++;
        await new Promise(r => setTimeout(r, 1000));
      }

      if (attempts >= 15) {
        setStatus('error');
        setErrorMsg('We received your payment, but plan activation is taking longer than expected. Please check your Account page in a few minutes.');
        return;
      }

      // 2. Load pending file from IndexedDB
      setStatus('uploading');
      try {
        const pending = await loadPendingUpload();
        if (pending && pending.file) {
          // Create the project (which is now unlocked)
          const project = await createBookProject(pending.title || pending.file.name.replace(/\.[^.]+$/, ''));
          // Upload the cover
          const data = await uploadCover(pending.file, project.id);
          await clearPendingUpload();
          onUploaded(data.cover_id);
          onNavigateHome();
          return;
        } else {
          // No pending file (maybe private browsing or expired) — just go home
          onNavigateHome();
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setErrorMsg('Plan activated, but we could not auto-upload your file. Please try selecting it again on the home page.');
      }
    }

    pollWebhookAndRetryUpload();

    return () => { polling = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: '2rem 3rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-glass-card)',
          border: '1px solid var(--border-glass)',
          backdropFilter: 'blur(12px)',
          maxWidth: '500px',
        }}
      >
        {status === 'confirming' && (
          <>
            <Scan size={48} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '1rem', display: 'inline-block' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Confirming Payment…</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Hang tight! Waiting for Polar to activate your subscription.</p>
          </>
        )}

        {status === 'uploading' && (
          <>
            <CheckCircle size={48} style={{ color: 'var(--accent-success)', marginBottom: '1rem', display: 'inline-block' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Plan Activated!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Automatically resuming your upload…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={48} style={{ color: 'var(--accent-danger)', marginBottom: '1rem', display: 'inline-block' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Almost there</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{errorMsg}</p>
            <button
              onClick={onNavigateHome}
              style={{
                padding: '0.6rem 1.3rem',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Return Home
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
