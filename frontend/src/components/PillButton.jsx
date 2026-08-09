import React from 'react';
import { motion } from 'framer-motion';

export default function PillButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: 'var(--radius-full)',
    fontWeight: '600',
    fontFamily: 'var(--font-family-sans)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-normal)',
    outline: 'none',
    border: '1px solid transparent',
  };

  const sizeStyles = {
    sm: { padding: '0.35rem 0.85rem', fontSize: '0.8125rem' },
    md: { padding: '0.6rem 1.3rem', fontSize: '0.925rem' },
    lg: { padding: '0.8rem 1.8rem', fontSize: '1rem' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--accent-primary)',
      color: '#FFFFFF',
      boxShadow: 'var(--glow-primary)',
    },
    neon: {
      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
      color: '#FFFFFF',
      boxShadow: '0 0 25px rgba(139, 92, 246, 0.45)',
    },
    glass: {
      backgroundColor: 'var(--bg-glass-card)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-glass-light)',
      backdropFilter: 'blur(8px)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-glass-light)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
    },
    danger: {
      backgroundColor: 'var(--accent-danger)',
      color: '#FFFFFF',
      boxShadow: 'var(--glow-danger)',
    },
    gold: {
      backgroundColor: 'var(--accent-warning)',
      color: 'var(--text-inverse)',
    },
    muted: {
      backgroundColor: 'var(--bg-surface-elevated)',
      color: 'var(--text-muted)',
    },
  };

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
      type={type}
      className={`pill-button pill-button--${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        opacity: disabled ? 0.5 : 1,
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}
