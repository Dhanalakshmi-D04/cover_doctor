import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Grid, Maximize2, ShieldAlert, Sparkles, Smartphone, ShoppingBag } from 'lucide-react';
import PillButton from './PillButton';

export default function VisualBreakdown({ imageSrc, ocrData = null, titleRatio = 18.4, contrastScore = 4.8 }) {
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas', 'thumbnail', 'amazon', 'mobile'
  const [showTitleBox, setShowTitleBox] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showContrastMap, setShowContrastMap] = useState(false);

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-glass-card)',
        border: '1px solid var(--border-glass)',
        backdropFilter: 'blur(12px)',
        padding: '1.25rem',
      }}
    >
      {/* Mode Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <PillButton size="sm" variant={activeTab === 'canvas' ? 'primary' : 'ghost'} icon={Eye} onClick={() => setActiveTab('canvas')}>
            Visual Diagnostic Overlay
          </PillButton>
          <PillButton size="sm" variant={activeTab === 'thumbnail' ? 'primary' : 'ghost'} icon={Maximize2} onClick={() => setActiveTab('thumbnail')}>
            Kindle Thumbnail (120px)
          </PillButton>
          <PillButton size="sm" variant={activeTab === 'amazon' ? 'primary' : 'ghost'} icon={ShoppingBag} onClick={() => setActiveTab('amazon')}>
            Amazon Listing
          </PillButton>
          <PillButton size="sm" variant={activeTab === 'mobile' ? 'primary' : 'ghost'} icon={Smartphone} onClick={() => setActiveTab('mobile')}>
            Mobile App View
          </PillButton>
        </div>

        {activeTab === 'canvas' && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setShowTitleBox((v) => !v)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: showTitleBox ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${showTitleBox ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                color: showTitleBox ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              T Title Box ({titleRatio}%)
            </button>
            <button
              onClick={() => setShowGrid((v) => !v)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: showGrid ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${showGrid ? 'var(--accent-secondary)' : 'var(--border-glass)'}`,
                color: showGrid ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              G Rule of Thirds
            </button>
            <button
              onClick={() => setShowContrastMap((v) => !v)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: showContrastMap ? 'rgba(244, 63, 94, 0.2)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${showContrastMap ? 'var(--accent-danger)' : 'var(--border-glass)'}`,
                color: showContrastMap ? 'var(--accent-danger)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              C Contrast Map ({contrastScore}:1)
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas Diagnostic Screen */}
      {activeTab === 'canvas' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              position: 'relative',
              maxWidth: '360px',
              width: '100%',
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <img src={imageSrc} alt="Diagnostic Cover Overlay" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

            {/* Title Bounding Box Overlay */}
            {showTitleBox && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute',
                  top: '12%',
                  left: '10%',
                  width: '80%',
                  height: `${Math.min(45, Math.max(15, titleRatio))}%`,
                  border: '2px dashed var(--accent-cyan)',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  padding: '4px',
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: 'var(--accent-cyan)', color: '#000', padding: '1px 5px', borderRadius: '3px' }}>
                  Title: {titleRatio}% height
                </span>
              </motion.div>
            )}

            {/* Rule of Thirds Grid */}
            {showGrid && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.25)', borderTop: '1px dashed rgba(139, 92, 246, 0.5)' }} />
                <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.25)', borderTop: '1px dashed rgba(139, 92, 246, 0.5)' }} />
                <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.25)', borderLeft: '1px dashed rgba(139, 92, 246, 0.5)' }} />
                <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.25)', borderLeft: '1px dashed rgba(139, 92, 246, 0.5)' }} />
              </div>
            )}

            {/* Contrast Heatmap Overlay */}
            {showContrastMap && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 50% 25%, transparent 30%, rgba(244, 63, 94, 0.45) 80%)',
                  mixBlendMode: 'multiply',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Click toggle buttons above to inspect OCR bounding geometry & WCAG focal contrast.
          </span>
        </div>
      )}

      {/* Kindle Thumbnail Scale (120px) */}
      {activeTab === 'thumbnail' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Kindle Store Thumbnail Preview (120px)</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>80% of readers judge titles at this exact pixel scale.</p>
          </div>
          <div style={{ height: '120px', aspectRatio: '2/3', borderRadius: '4px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <img src={imageSrc} alt="Kindle Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      )}

      {/* Amazon Mockup */}
      {activeTab === 'amazon' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '420px', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FFFFFF', color: '#111', display: 'flex', gap: '1rem' }}>
            <div style={{ width: '90px', aspectRatio: '2/3', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
              <img src={imageSrc} alt="Amazon Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', lineHeight: '1.2' }}>The Bestseller Mystery Code</div>
              <div style={{ fontSize: '0.75rem', color: '#555', margin: '0.2rem 0' }}>by Author Name</div>
              <div style={{ color: '#E67E22', fontSize: '0.8rem' }}>★★★★★ 4.8 (1,240 ratings)</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#B12704', marginTop: '0.4rem' }}>Kindle Unlimited $0.00</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Frame */}
      {activeTab === 'mobile' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '180px', height: '320px', borderRadius: '24px', border: '6px solid #222', backgroundColor: '#090D16', padding: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <img src={imageSrc} alt="Mobile Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          </div>
        </div>
      )}
    </div>
  );
}
