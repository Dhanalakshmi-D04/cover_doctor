import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../stores/useUIStore';

export default function Toast() {
  const toast = useUIStore((state) => state.toast);
  const hideToast = useUIStore((state) => state.hideToast);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle size={18} color="var(--accent-success)" />,
    error: <AlertCircle size={18} color="var(--accent-danger)" />,
    info: <Info size={18} color="var(--accent-primary)" />,
  };

  const borders = {
    success: 'var(--accent-success)',
    error: 'var(--accent-danger)',
    info: 'var(--accent-primary)',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.75rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: `4px solid ${borders[toast.type] || borders.info}`,
          borderTop: '1px solid var(--border-glass)',
          borderRight: '1px solid var(--border-glass)',
          borderBottom: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontWeight: '500',
        }}
      >
        {icons[toast.type] || icons.info}
        <span>{toast.message}</span>
        <button
          onClick={hideToast}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            marginLeft: '0.5rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
