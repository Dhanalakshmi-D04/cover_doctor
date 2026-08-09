import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Split, Palette, Download, ShieldCheck, ArrowRight } from 'lucide-react';
import UploadZone from '../components/UploadZone';
import PillButton from '../components/PillButton';

export default function Home({ onUploaded, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid var(--accent-primary)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1rem',
          }}
        >
          <Sparkles size={16} />
          <span>Quantitative Book Cover Scoring & Bestseller Analytics</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: '2.8rem',
            fontWeight: '800',
            fontFamily: 'var(--font-family-heading)',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          Will your book cover stand out and sell on Amazon?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginTop: '0.75rem',
            lineHeight: '1.6',
          }}
        >
          Drop your cover artwork for instant mathematical diagnostic analysis: title legibility ratio, contrast heatmap, color palette compliance, and genre bestseller benchmarks.
        </motion.p>
      </div>

      {/* Upload Zone Component */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
      >
        <UploadZone onUploaded={onUploaded} />
      </motion.div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Explorer */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          onClick={() => onNavigate('explore')}
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <BookOpen size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Bestseller Explorer
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Browse top Amazon bestseller covers & target statistics across 5 fiction and non-fiction genres.
            </p>
          </div>
          <PillButton variant="glass" size="sm" icon={ArrowRight} style={{ marginTop: '1.25rem', width: '100%' }}>
            Explore Benchmarks
          </PillButton>
        </motion.div>

        {/* A/B Studio */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          onClick={() => onNavigate('ab-test')}
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Split size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              A/B Revision Studio
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Side-by-side interactive split slider comparing cover revisions, contrast deltas, and legibility math.
            </p>
          </div>
          <PillButton variant="glass" size="sm" icon={ArrowRight} style={{ marginTop: '1.25rem', width: '100%' }}>
            Run Cover A/B Poll
          </PillButton>
        </motion.div>

        {/* Palette Studio */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          onClick={() => onNavigate('palette-studio')}
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Palette size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Color & Font Studio
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Extract dominant HSL swatches, calculate WCAG text contrast matrices, and inspect visual mood harmony.
            </p>
          </div>
          <PillButton variant="glass" size="sm" icon={ArrowRight} style={{ marginTop: '1.25rem', width: '100%' }}>
            Inspect Legibility
          </PillButton>
        </motion.div>

        {/* Export Brief */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          onClick={() => onNavigate('export')}
          style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Download size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              PDF Brief Export
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Download PDF reports & generate designer feedback briefs for professional cover illustrators.
            </p>
          </div>
          <PillButton variant="glass" size="sm" icon={ArrowRight} style={{ marginTop: '1.25rem', width: '100%' }}>
            Export PDF Brief
          </PillButton>
        </motion.div>
      </div>
    </div>
  );
}
