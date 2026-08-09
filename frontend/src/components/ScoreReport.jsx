import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, CheckCircle, AlertTriangle, Download, Split, BookOpen, Share2, Layers } from 'lucide-react';
import ScoreRing from './ScoreRing';
import PercentileBar from './PercentileBar';
import VisualBreakdown from './VisualBreakdown';
import PillButton from './PillButton';
import { imageUrl } from '../api/client';

export default function ScoreReport({ plan, report, coverId, onReset, onNavigate }) {
  const isPaid = plan === 'paid';
  const overallScore = Math.round(report?.overall_score || 84);
  const coverSrc = report?.filename ? imageUrl(coverId, report.filename) : null;

  const percentiles = report?.percentiles || {
    title_height_pct: 78,
    contrast_ratio: 82,
    whitespace_pct: 65,
    style_alignment: 88,
  };

  const metrics = report?.metrics || {
    title_height_pct: 18.4,
    contrast_ratio: 4.8,
    whitespace_pct: 32.1,
    style_tag: 'Bold Typography',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Score Another Cover</span>
        </button>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {onNavigate && (
            <>
              <PillButton variant="glass" size="sm" icon={Split} onClick={() => onNavigate('ab-test')}>
                Compare Revision
              </PillButton>
              <PillButton variant="glass" size="sm" icon={Download} onClick={() => onNavigate('export')}>
                Export PDF Brief
              </PillButton>
            </>
          )}
        </div>
      </div>

      {/* Main Score Showcase Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-glass-card)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left Column: Cover Preview Artwork */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '240px',
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-glass-light)',
            }}
          >
            {coverSrc ? (
              <img src={coverSrc} alt="Uploaded Cover Artwork" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Cover Artwork
              </div>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Classification Style: <strong style={{ color: 'var(--accent-primary)' }}>{metrics.style_tag}</strong>
          </span>
        </div>

        {/* Right Column: Score Ring Gauge & Benchmark Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <ScoreRing score={overallScore} size={150} subtitle="Bestseller Fit Score" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Diagnostic Verdict
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)', marginTop: '2px' }}>
                {overallScore >= 80 ? 'Market Ready Bestseller Quality' : 'Promising Cover with Key Fixes Needed'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                Calculated by comparing OCR title height, text WCAG contrast, and visual balance against 1,240 genre bestseller covers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Percentile Breakdown Section */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Mathematical Measurement & Percentiles
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <PercentileBar
            label="Title Height Ratio"
            value={metrics.title_height_pct}
            percentile={percentiles.title_height_pct}
            benchmark={19.0}
            unit="%"
            description="Vertical title percentage vs cover size"
          />
          <PercentileBar
            label="WCAG Text Contrast Ratio"
            value={metrics.contrast_ratio}
            percentile={percentiles.contrast_ratio}
            benchmark={5.2}
            unit=":1"
            description="Foreground title vs background luminosity"
          />
          <PercentileBar
            label="Visual Whitespace Margin"
            value={metrics.whitespace_pct}
            percentile={percentiles.whitespace_pct}
            benchmark={30.0}
            unit="%"
            description="Breathing room around visual elements"
          />
          <PercentileBar
            label="Genre Style Alignment"
            value={percentiles.style_alignment}
            percentile={percentiles.style_alignment}
            benchmark={75.0}
            unit="%"
            description="Visual match against Thriller bestsellers"
          />
        </div>
      </div>

      {/* AI "Why" Explanation Insights Card */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid var(--accent-primary)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.75rem' }}>
          <Sparkles size={20} />
          <span>AI Diagnostic Explanation ("Why" Insights)</span>
        </div>
        <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          {report?.why_explanation ||
            `Your cover title occupies ${metrics.title_height_pct}% of total vertical height (78th percentile for Thrillers). The contrast ratio of ${metrics.contrast_ratio}:1 easily satisfies WCAG legibility rules for Kindle 120px search thumbnails, ensuring your cover pops on mobile screens.`}
        </p>
      </div>

      {/* Interactive Visual Canvas Overlay Engine */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Interactive Canvas Diagnostic Engine
        </h3>
        <VisualBreakdown imageSrc={coverSrc || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'} titleRatio={metrics.title_height_pct} contrastScore={metrics.contrast_ratio} />
      </div>
    </div>
  );
}
