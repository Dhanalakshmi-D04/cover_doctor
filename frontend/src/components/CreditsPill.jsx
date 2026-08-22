import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Info, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export default function CreditsPill({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const projectCount = useAuthStore((state) => state.projectCount) || 0;
  const projectLimit = useAuthStore((state) => state.projectLimit) || 0;
  const plan = useAuthStore((state) => state.plan);

  const isLow = projectCount >= projectLimit && projectLimit > 0;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="View project usage"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.45rem 0.95rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: isLow ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-glass-card)',
          border: `1px solid ${isLow ? 'var(--accent-warning)' : 'var(--border-glass-light)'}`,
          color: isLow ? 'var(--accent-warning)' : 'var(--text-primary)',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'all var(--transition-fast)',
        }}
      >
        <Zap size={14} color={isLow ? 'var(--accent-warning)' : 'var(--accent-primary)'} fill={isLow ? 'var(--accent-warning)' : 'var(--accent-primary)'} />
        <span>{projectCount} / {projectLimit}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>projects</span>
        <Info size={12} style={{ opacity: 0.6, marginLeft: '0.2rem' }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '260px',
              padding: '1rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-glass-light)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.9rem' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <span>Project Usage</span>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: '700' }}>
                {plan}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
              Each book project tracks unlimited cover revisions for a single title.
            </p>

            <button
              onClick={() => {
                setOpen(false);
                if (onNavigate) onNavigate('pricing');
              }}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.825rem',
                cursor: 'pointer',
              }}
            >
              <PlusCircle size={14} />
              <span>Upgrade Plan</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
