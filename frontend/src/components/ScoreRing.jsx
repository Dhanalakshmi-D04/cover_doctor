import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ScoreRing({ score = 85, size = 160, strokeWidth = 12, subtitle = 'Overall Cover Score' }) {
  const [currentScore, setCurrentScore] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Score status color calculation
  const getScoreColor = (val) => {
    if (val >= 80) return { stroke: 'var(--accent-success)', glow: 'var(--glow-success)', label: 'Strong' };
    if (val >= 60) return { stroke: 'var(--accent-warning)', glow: '0 0 20px rgba(245, 158, 11, 0.4)', label: 'Moderate' };
    return { stroke: 'var(--accent-danger)', glow: 'var(--glow-danger)', label: 'Needs Fixes' };
  };

  const { stroke, glow, label } = getScoreColor(clampedScore);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = clampedScore / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= clampedScore) {
        setCurrentScore(clampedScore);
        clearInterval(timer);
      } else {
        setCurrentScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [clampedScore]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={stroke} />
              <stop offset="100%" stopColor="var(--accent-secondary)" />
            </linearGradient>
          </defs>

          {/* Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--bg-surface-elevated)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Animated Value Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(${glow})` }}
          />
        </svg>

        {/* Center Text Display */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: `${size * 0.26}px`, fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)', lineHeight: 1 }}>
            {currentScore}
          </span>
          <span style={{ fontSize: `${size * 0.09}px`, fontWeight: '700', color: stroke, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
            {label}
          </span>
        </div>
      </div>
      {subtitle && (
        <span style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
