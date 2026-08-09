import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Search, Mail, Sparkles, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import PillButton from '../components/PillButton';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0);

  const faqs = [
    {
      question: 'How is the Cover Doctor Score (0–100) calculated?',
      answer:
        'Every score comes strictly from deterministic mathematical measurements, never AI opinions. We compute OCR bounding boxes for Title/Subtitle height ratio, text-to-background WCAG contrast ratios, color palette harmony vectors, and visual whitespace distribution, comparing these against genre bestseller benchmark statistical averages.',
    },
    {
      question: 'Where is AI used in Cover Doctor?',
      answer:
        'AI is used exclusively for two bounded tasks: 1) Classifying cover artwork into fixed style tags (e.g. Bold Typography, Dark Photographic, Illustrated, Minimalist), and 2) Phrasing finished mathematical results into natural, clear "Why" explanations for authors.',
    },
    {
      question: 'What is the Title Height Ratio benchmark?',
      answer:
        'Title Height Ratio measures the vertical percentage of the cover occupied by title typography. Bestsellers across Thriller and Non-Fiction typically maintain 18%–22% height ratios so titles remain readable at Kindle search thumbnail scale (120px height).',
    },
    {
      question: 'How do credits work and do they expire?',
      answer:
        'Each diagnostic cover report, A/B revision test, or color palette extraction uses 1 credit. Free tier users start with 50 initial credits. Paid subscription credits roll over each month.',
    },
    {
      question: 'Can I export reports as PDFs for my author/publisher clients?',
      answer:
        'Yes! Navigate to the Export tab from any cover report to generate high-resolution PDFs with customizable section visibility, score rings, contrast maps, and optional custom studio branding.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          <HelpCircle size={18} />
          <span>Support & Diagnostic Knowledge Base</span>
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-family-heading)', color: 'var(--text-primary)' }}>
          Help Center & Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Find answers about our deterministic scoring math, genre benchmarks, AI explainability, and report exports.
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search questions, scoring metrics, contrast rules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 2.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass-light)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            outline: 'none',
            backdropFilter: 'blur(8px)',
          }}
        />
      </div>

      {/* FAQ Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredFaqs.map((faq, idx) => {
          const isOpen = expandedIndex === idx;
          return (
            <div
              key={idx}
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-glass-card)',
                border: `1px solid ${isOpen ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                backdropFilter: 'blur(8px)',
                overflow: 'hidden',
                transition: 'all var(--transition-fast)',
              }}
            >
              <button
                onClick={() => setExpandedIndex(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  padding: '1.15rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span>{faq.question}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} color="var(--text-secondary)" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', borderTop: '1px dashed var(--border-glass)' }}>
                      <p style={{ marginTop: '0.75rem' }}>{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Contact Support Banner */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Mail size={24} color="var(--accent-primary)" />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>Need help with a custom publishing project?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Our team of cover engineers and typography specialists are on standby.</p>
          </div>
        </div>
        <PillButton variant="primary" onClick={() => alert('Support team notified! We will contact your account email.')}>
          Contact Studio Support
        </PillButton>
      </div>
    </div>
  );
}
