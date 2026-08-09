import React from 'react';
import { motion } from 'framer-motion';

export default function PercentileBar({
  label,
  value,
  percentile = 50,
  benchmark = 50,
  unit = '%',
  description = '',
}) {
  const roundedPercentile = Math.round(percentile);
  
  const getBadgeColor = (p) => {
    if (p >= 75) return { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--accent-success)' };
    if (p >= 40) return { bg: 'rgba(245, 158, 11, 0.15)', text: 'var(--accent-warning)' };
    return { bg: 'rgba(244, 63, 94, 0.15)', text: 'var(--accent-danger)' };
  };

  const badge = getBadgeColor(roundedPercentile);

  return (
    <div
      style={{
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-glass-card)',
        border: '1px solid var(--border-glass)',
        backdropFilter: 'blur(8px)',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div>
          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</span>
          {description && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit}
          </span>
          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: badge.bg,
              color: badge.text,
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            {roundedPercentile}th %ile
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div
        style={{
          position: 'relative',
          height: '10px',
          width: '100%',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        {/* Fill Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, roundedPercentile))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, var(--accent-primary), ${badge.text})`,
            borderRadius: 'var(--radius-full)',
          }}
        />

        {/* Benchmark Marker Line */}
        {benchmark !== undefined && (
          <div
            title={`Genre Benchmark Mean: ${benchmark}%`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${benchmark}%`,
              width: '2px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 4px rgba(0,0,0,0.8)',
              zIndex: 2,
            }}
          />
        )}
      </div>
    </div>
  );
}
