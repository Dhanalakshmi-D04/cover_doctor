import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, BookOpen, Library, Check } from 'lucide-react';
import { getCheckoutURL } from '../api/client';
import PillButton from './PillButton';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '€19',
    period: '/mo',
    icon: BookOpen,
    color: 'var(--accent-success)',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'Perfect for a single book project.',
    limit: '1 book project',
    features: [
      'Unlimited cover re-checks',
      'Full percentile ranking',
      'Competitive pattern summary',
      'Visual breakdowns',
      'Evolution tracking',
      '1 book project',
    ],
  },
  {
    key: 'creator',
    name: 'Creator',
    price: '€79',
    period: '/mo',
    icon: Zap,
    color: 'var(--accent-primary)',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    description: 'For authors with an active catalogue.',
    limit: '5 book projects',
    popular: true,
    features: [
      'Unlimited cover re-checks',
      'Full percentile ranking',
      'Competitive pattern summary',
      'Visual breakdowns',
      'Evolution tracking',
      '5 book projects',
    ],
  },
  {
    key: 'publisher',
    name: 'Publisher',
    price: '€199',
    period: '/mo',
    icon: Library,
    color: 'var(--accent-warning)',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Scale across your full catalogue.',
    limit: '20 book projects',
    features: [
      'Unlimited cover re-checks',
      'Full percentile ranking',
      'Competitive pattern summary',
      'Visual breakdowns',
      'Evolution tracking',
      '20 book projects',
    ],
  },
];

/**
 * PricingModal — displayed when the backend returns a 403 plan_limit_reached error.
 *
 * Props:
 *   isOpen            boolean              — whether the modal is visible
 *   onClose           () => void           — called when the user dismisses
 *   currentPlan       string               — e.g. "free", "starter"
 *   message           string               — backend error message to show at top
 *   onBeforeRedirect  async () => void     — called before redirecting to Polar (save file to IndexedDB)
 */
export default function PricingModal({ isOpen, onClose, currentPlan = 'free', message, onBeforeRedirect }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  async function handleSubscribe(planKey) {
    setLoadingPlan(planKey);
    setCheckoutError('');
    try {
      const data = await getCheckoutURL(planKey);
      if (data?.checkout_url) {
        if (onBeforeRedirect) await onBeforeRedirect();
        window.location.href = data.checkout_url;
      } else {
        setCheckoutError('Checkout unavailable — please try again.');
        setLoadingPlan(null);
      }
    } catch (err) {
      setCheckoutError(err.message || 'Checkout error — please try again.');
      setLoadingPlan(null);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        /* Backdrop */
        <motion.div
          key="pricing-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Modal panel */}
          <motion.div
            key="pricing-modal-panel"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1,
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h2 style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                fontFamily: 'var(--font-family-heading)',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}>
                Upgrade your plan
              </h2>
              {message && (
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--accent-warning)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 1rem',
                  display: 'inline-block',
                }}>
                  {message}
                </p>
              )}
            </div>

            {/* Plan cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}>
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrent = currentPlan === plan.key;
                const isLoading = loadingPlan === plan.key;

                return (
                  <motion.div
                    key={plan.key}
                    whileHover={{ y: -3 }}
                    style={{
                      position: 'relative',
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--bg-glass-card)',
                      border: plan.popular
                        ? `2px solid ${plan.color}`
                        : '1px solid var(--border-glass)',
                      backdropFilter: 'blur(12px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: plan.color,
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        whiteSpace: 'nowrap',
                      }}>
                        MOST POPULAR
                      </div>
                    )}

                    {/* Plan header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: plan.bgColor,
                        color: plan.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                          {plan.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {plan.description}
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: plan.color }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {plan.period}
                      </span>
                    </div>

                    {/* Features */}
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                          <Check size={14} style={{ color: plan.color, flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <PillButton
                      variant={plan.popular ? 'neon' : 'outline'}
                      onClick={() => handleSubscribe(plan.key)}
                      isLoading={isLoading}
                      disabled={isCurrent || !!loadingPlan}
                      style={{ width: '100%', marginTop: 'auto' }}
                    >
                      {isCurrent ? 'Current plan' : isLoading ? 'Redirecting…' : `Subscribe — ${plan.price}/mo`}
                    </PillButton>
                  </motion.div>
                );
              })}
            </div>

            {checkoutError && (
              <p style={{ textAlign: 'center', color: 'var(--accent-danger)', marginTop: '1rem', fontSize: '0.85rem' }}>
                {checkoutError}
              </p>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              All plans include unlimited re-checks. Billed monthly. Cancel anytime via the billing portal.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
