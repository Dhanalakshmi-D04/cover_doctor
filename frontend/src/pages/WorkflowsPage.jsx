import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, BookOpen, CheckCircle, ArrowRight, Sparkles, Sliders, Type, Contrast, Eye } from 'lucide-react';
import PillButton from '../components/PillButton';

export default function WorkflowsPage({ onNavigate }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState('kindle');

  const workflows = [
    {
      id: 'kindle',
      title: 'Kindle Thumbnail Legibility Workflow',
      category: 'Typography & Scale',
      icon: Eye,
      steps: [
        'Upload your draft cover artwork into Cover Doctor.',
        'Use the Visual Diagnostic Overlay to switch to "Kindle Thumbnail (120px)".',
        'Verify that your Title Box ratio is >= 18% of total height.',
        'Check contrast scores to ensure text is legible against dark or complex visual backgrounds.',
        'If score is below 75, increase title font size or add subtle drop-shadow background gradient.',
      ],
      proTip: 'Over 80% of readers browse on mobile search listings. If your title fails at 120px height, sales drop by up to 34%.',
    },
    {
      id: 'ab-testing',
      title: 'A/B Cover Revision Comparison Workflow',
      category: 'A/B Studio',
      icon: Sliders,
      steps: [
        'Create two design variations of your cover (Variant A: Dark & Moody, Variant B: High Contrast Typography).',
        'Analyze Variant A in Cover Doctor and save report ID.',
        'Upload Variant B and navigate to A/B Studio.',
        'Drag the split-screen slider to compare title legibility, contrast heatmaps, and benchmark percentiles side-by-side.',
        'Pick the cover version with the highest overall score and genre percentile alignment.',
      ],
      proTip: 'Always test contrasting color palettes (e.g. Amber vs Cyan text accents) to see which pops against bestseller genre benchmarks.',
    },
    {
      id: 'genre-alignment',
      title: 'Genre Bestseller Alignment Workflow',
      category: 'Market Fit',
      icon: BookOpen,
      steps: [
        'Open the Bestseller Explorer page and select your target genre (e.g. Thriller & Crime).',
        'Review the genre benchmark mean metrics (Title Height avg: 19.2%, Contrast avg: 5.4:1).',
        'Check the top-performing style tags (e.g., Bold Typography vs Dark Photographic).',
        'Calibrate your artwork color palette using Palette Studio to match high-converting genre harmony trends.',
      ],
      proTip: 'Fitting genre visual cues does not mean copying — it ensures readers instantly recognize your book category on Amazon.',
    },
  ];

  const current = workflows.find((w) => w.id === selectedWorkflow) || workflows[0];
  const CurrentIcon = current.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase' }}>
          <Compass size={16} />
          <span>Interactive Studio Guides</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
          Cover Optimization Workflows & How-Tos
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
          Step-by-step studio protocols for authors and professional designers to maximize book cover conversion, thumbnail scale legibility, and genre market fit.
        </p>
      </div>

      {/* Workflow Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {workflows.map((wf) => {
          const Icon = wf.icon;
          const isSelected = wf.id === selectedWorkflow;
          return (
            <motion.div
              key={wf.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedWorkflow(wf.id)}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-glass-card)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                <Icon size={20} />
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>{wf.category}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>{wf.title}</h3>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Workflow Detailed Card */}
      <div
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-glass-card)',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-primary)', color: '#FFF' }}>
            <CurrentIcon size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)' }}>
              {current.title}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>Protocol Category: {current.category}</span>
          </div>
        </div>

        {/* Steps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
          {current.steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-glass-light)',
                  color: 'var(--accent-primary)',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: '1.5' }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Pro Tip Box */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid var(--accent-warning)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Sparkles size={20} color="var(--accent-warning)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--accent-warning)', display: 'block', marginBottom: '2px' }}>Studio Best Practice Pro-Tip:</strong>
            <span style={{ color: 'var(--text-secondary)' }}>{current.proTip}</span>
          </div>
        </div>

        <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem' }}>
          <PillButton variant="neon" icon={Sparkles} onClick={() => onNavigate && onNavigate('home')}>
            Start Diagnostic Analysis
          </PillButton>
          <PillButton variant="outline" icon={ArrowRight} onClick={() => onNavigate && onNavigate('explore')}>
            Browse Genre Bestsellers
          </PillButton>
        </div>
      </div>
    </div>
  );
}
