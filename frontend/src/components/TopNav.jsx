import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Split,
  Palette,
  Download,
  DollarSign,
  HelpCircle,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import CreditsPill from './CreditsPill';
import AvatarDropdown from './AvatarDropdown';
import { useUIStore } from '../stores/useUIStore';

export default function TopNav({ activeTab, setActiveTab, onLogout }) {

  const { theme, toggleTheme, isMobileNavOpen, setMobileNavOpen } = useUIStore();

  const navItems = [
    { id: 'home', label: 'Analyze', icon: Sparkles },
    { id: 'explore', label: 'Explorer', icon: BookOpen },
    { id: 'ab-test', label: 'A/B Studio', icon: Split },
    { id: 'palette-studio', label: 'Palette', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'workflows', label: 'Workflows', icon: Compass },
    { id: 'help', label: 'Help/FAQ', icon: HelpCircle },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        transition: 'all var(--transition-normal)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab && setActiveTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '800',
              boxShadow: 'var(--glow-primary)',
            }}
          >
            CD
          </div>
          <div>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: '800',
                fontFamily: 'var(--font-family-heading)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Cover Doctor
            </span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Studio Diagnostics
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab && setActiveTab(item.id)}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={15} color={isActive ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--accent-primary)',
                      pointerEvents: 'none',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-glass-card)',
              border: '1px solid var(--border-glass-light)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={18} color="var(--accent-warning)" /> : <Moon size={18} color="var(--accent-primary)" />}
          </button>

          {/* Credits Pill */}
          <CreditsPill onNavigate={setActiveTab} />

          {/* User Account / Avatar Dropdown */}
          <AvatarDropdown onLogout={onLogout} onNavigate={setActiveTab} />

          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileNavOpen(!isMobileNavOpen)}
            aria-label="Toggle mobile menu"
            className="mobile-nav-toggle"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {isMobileNavOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-glass)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: activeTab === item.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeTab === item.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                  border: 'none',
                  fontSize: '0.925rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('admin');
              setMobileNavOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              fontSize: '0.925rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <Shield size={18} />
            <span>Admin Portal</span>
          </button>
        </motion.div>
      )}
    </header>
  );
}
