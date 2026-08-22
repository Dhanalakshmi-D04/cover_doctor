import React, { useState } from "react";
import PillButton from "../components/PillButton";
import { getCheckoutURL } from "../api/client";
import { useAuthStore } from "../stores/useAuthStore";
import { Check, Zap, BookOpen, Library } from "lucide-react";
import { motion } from "framer-motion";

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

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  
  const currentPlan = useAuthStore((state) => state.plan);

  async function handleSubscribe(planKey) {
    setLoadingPlan(planKey);
    setCheckoutError("");
    try {
      const data = await getCheckoutURL(planKey);
      if (data && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setCheckoutError("Checkout unavailable — please try again.");
        setLoadingPlan(null);
      }
    } catch (err) {
      setCheckoutError(err.message || "Checkout error — please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Simple, transparent pricing
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Choose the plan that fits your catalogue. All plans include unlimited revisions.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
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
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-glass-card)',
                border: plan.popular
                  ? `2px solid ${plan.color}`
                  : '1px solid var(--border-glass)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
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
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: plan.bgColor,
                  color: plan.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {plan.description}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: plan.color }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '0.5rem 0' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <Check size={16} style={{ color: plan.color, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <PillButton
                variant={plan.popular ? 'neon' : 'outline'}
                size="lg"
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
        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--accent-danger)' }}>
          {checkoutError}
        </div>
      )}
    </div>
  );
}
