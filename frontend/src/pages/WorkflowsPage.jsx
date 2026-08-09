import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────────────────
   BookCover Doctor — Interactive Storybook Workflow Page
   Scroll-driven, alternating left/right hardcover book animation
───────────────────────────────────────────────────────────────────────────── */

/* ── Palette ── */
const C = {
  bg:           '#F5F0E6',
  ink:          '#29251F',
  inkLight:     '#695F52',
  inkMuted:     '#9E8E7C',
  forest:       '#1B4332',
  forestLight:  '#2D6A4F',
  sage:         '#6B7D5B',
  brown:        '#4A3728',
  brownLight:   '#8B6F52',
  warmGold:     '#C2A15A',
};

/* ── Book colour palettes per step ── */
const BOOK_THEMES = [
  { cover: '#1B4332', spine: '#0F2B21', text: '#FAF7F0', accent: '#C2A15A' },
  { cover: '#7B5E3A', spine: '#5A4127', text: '#FAF7F0', accent: '#D4A843' },
  { cover: '#2D5A3D', spine: '#1A3B27', text: '#FAF7F0', accent: '#A8C89A' },
  { cover: '#5C4A2A', spine: '#3D3018', text: '#FAF7F0', accent: '#D4A843' },
  { cover: '#3B5E45', spine: '#233B2B', text: '#FAF7F0', accent: '#8BB89E' },
  { cover: '#6B4A35', spine: '#4A3020', text: '#FAF7F0', accent: '#C8956A' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Step Content Panels
───────────────────────────────────────────────────────────────────────────── */
function SignInContent() {
  const [activeField, setActiveField] = useState(null);
  return (
    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem', boxShadow: '0 4px 16px rgba(27,67,50,0.3)' }}>
          <span style={{ fontSize: '1.2rem' }}>📖</span>
        </div>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6B7D5B', textTransform: 'uppercase' }}>BookCover Doctor</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#29251F', fontFamily: 'Playfair Display, serif', marginTop: '0.2rem' }}>Welcome back</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {[{ icon: '👤', label: 'Create Account', sub: 'name · email · password' }, { icon: '🔑', label: 'Secure Login', sub: 'authenticated session' }, { icon: '🏠', label: 'Enter Dashboard', sub: 'your workspace awaits' }].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.6rem', borderRadius: 8, background: i === 1 ? 'rgba(27,67,50,0.08)' : 'rgba(245,240,230,0.7)', border: `1px solid ${i === 1 ? 'rgba(27,67,50,0.2)' : 'rgba(194,161,90,0.2)'}` }}>
            <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#29251F' }}>{item.label}</div>
              <div style={{ fontSize: '0.58rem', color: '#9E8E7C' }}>{item.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', padding: '0.65rem', borderRadius: 10, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(194,161,90,0.3)' }}>
        <div style={{ fontSize: '0.58rem', color: '#9E8E7C', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Sign Up</div>
        {['Email address', 'Password'].map((ph, i) => (
          <div key={i} onClick={() => setActiveField(i)} style={{ height: 26, borderRadius: 5, border: `1px solid ${activeField === i ? '#1B4332' : 'rgba(107,125,91,0.3)'}`, background: '#FFF', display: 'flex', alignItems: 'center', padding: '0 0.5rem', cursor: 'pointer', marginBottom: '0.3rem', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '0.6rem', color: '#9E8E7C' }}>{ph}</span>
          </div>
        ))}
        <div style={{ height: 26, borderRadius: 5, background: 'linear-gradient(90deg, #1B4332, #2D6A4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>Start Your Journey →</span>
        </div>
      </div>
    </div>
  );
}

function UploadContent() {
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 18 + 8;
        if (p >= 100) { p = 100; setUploaded(true); clearInterval(iv); }
        setProgress(Math.min(p, 100));
      }, 180);
      return () => clearInterval(iv);
    }, 800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6B7D5B', textTransform: 'uppercase' }}>Studio Dashboard</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#29251F', fontFamily: 'Playfair Display, serif', marginTop: '0.2rem' }}>Your Cover Studio</div>
      </div>
      <div style={{ padding: '0.5rem 0.65rem', borderRadius: 8, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(194,161,90,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.95rem' }}>📁</span>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#29251F' }}>My Novel Project</div>
          <div style={{ fontSize: '0.56rem', color: '#9E8E7C' }}>Created today · 1 cover</div>
        </div>
      </div>
      <div style={{ border: `2px dashed ${uploaded ? '#1B4332' : 'rgba(107,125,91,0.4)'}`, borderRadius: 10, padding: '0.9rem', textAlign: 'center', background: uploaded ? 'rgba(27,67,50,0.06)' : 'rgba(245,240,230,0.5)', transition: 'all 0.5s' }}>
        <AnimatePresence mode="wait">
          {!uploaded ? (
            <motion.div key="drop" exit={{ opacity: 0 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>☁️</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#29251F' }}>Drag & Drop Cover</div>
              <div style={{ fontSize: '0.56rem', color: '#9E8E7C' }}>JPG · PNG · PDF</div>
              <div style={{ marginTop: '0.5rem', height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #1B4332, #2D6A4F)', width: `${progress}%`, transition: 'width 0.2s' }} />
              </div>
              {progress > 0 && <div style={{ fontSize: '0.55rem', color: '#6B7D5B', marginTop: '0.15rem' }}>{Math.round(progress)}% uploading…</div>}
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1B4332' }}>Cover Uploaded!</div>
              <div style={{ fontSize: '0.56rem', color: '#9E8E7C' }}>stored · ready to analyse</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: 'auto' }}>
        {['Dashboard', 'Upload', 'Stored'].map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ padding: '0.25rem 0.5rem', borderRadius: 5, fontSize: '0.58rem', fontWeight: 700, background: i <= (uploaded ? 2 : progress > 0 ? 1 : 0) ? '#1B4332' : 'rgba(0,0,0,0.06)', color: i <= (uploaded ? 2 : progress > 0 ? 1 : 0) ? '#fff' : '#9E8E7C', transition: 'all 0.4s' }}>{label}</div>
            {i < 2 && <div style={{ fontSize: '0.55rem', color: '#9E8E7C' }}>→</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ExtractContent() {
  const [scan, setScan] = useState(0);
  const [detected, setDetected] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        setScan(s => { const ns = s + 1.8; if (ns >= 100) { clearInterval(iv); return 100; } return ns; });
      }, 40);
      return () => clearInterval(iv);
    }, 600);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (scan >= 28 && !detected.includes('title')) setDetected(d => [...d, 'title']);
    if (scan >= 55 && !detected.includes('subtitle')) setDetected(d => [...d, 'subtitle']);
    if (scan >= 80 && !detected.includes('author')) setDetected(d => [...d, 'author']);
  }, [scan, detected]);

  const boxes = {
    title:    { top: '12%', left: '8%', width: '84%', height: '18%', color: '#1B4332' },
    subtitle: { top: '36%', left: '12%', width: '76%', height: '12%', color: '#C2A15A' },
    author:   { top: '72%', left: '18%', width: '64%', height: '11%', color: '#8B5E3C' },
  };

  return (
    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6B7D5B', textTransform: 'uppercase' }}>OCR Extraction</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#29251F', fontFamily: 'Playfair Display, serif', marginTop: '0.2rem' }}>Reading Structure</div>
      </div>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(160deg, #1B4332 0%, #8B6F52 100%)', aspectRatio: '3/4', maxHeight: 150, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, padding: '0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'Playfair Display, serif', lineHeight: 1.2 }}>The Last<br />Chapter</div>
          <div style={{ color: 'rgba(194,161,90,0.9)', fontSize: '0.5rem', fontWeight: 600 }}>A Story of Discovery</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.5rem' }}>by Jane Doe</div>
        </div>
        {scan < 100 && <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(0,220,180,0.7)', boxShadow: '0 0 8px rgba(0,220,180,0.5)', top: `${scan}%`, zIndex: 10 }} />}
        {Object.entries(boxes).map(([key, b]) => (
          detected.includes(key) && (
            <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', top: b.top, left: b.left, width: b.width, height: b.height, border: `2px solid ${b.color}`, borderRadius: 3, boxShadow: `0 0 6px ${b.color}66`, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -13, left: 0, fontSize: '0.45rem', fontWeight: 800, color: b.color, background: 'rgba(255,255,255,0.9)', padding: '1px 3px', borderRadius: 3, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{key}</div>
            </motion.div>
          )
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {[{ key: 'title', label: 'Title', value: '"The Last Chapter"', color: '#1B4332' }, { key: 'subtitle', label: 'Subtitle', value: '"A Story…"', color: '#C2A15A' }, { key: 'author', label: 'Author', value: '"Jane Doe"', color: '#8B5E3C' }].map(item => (
          <motion.div key={item.key} animate={{ opacity: detected.includes(item.key) ? 1 : 0.25 }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.5rem', borderRadius: 6, background: 'rgba(245,240,230,0.7)', border: `1px solid ${detected.includes(item.key) ? item.color + '55' : 'transparent'}`, transition: 'all 0.4s' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#695F52' }}>{item.label}</span>
            <span style={{ fontSize: '0.56rem', color: '#9E8E7C', marginLeft: 'auto' }}>{item.value}</span>
          </motion.div>
        ))}
      </div>
      <div style={{ fontSize: '0.56rem', color: '#9E8E7C', textAlign: 'center', fontStyle: 'italic', marginTop: 'auto' }}>OCR extracts text and its position on the cover.</div>
    </div>
  );
}

function MeasureContent() {
  const metrics = [
    { label: 'Title Height %', value: 24.3, max: 40, unit: '%', color: '#1B4332', benchmark: 19.2 },
    { label: 'Contrast Ratio', value: 6.8, max: 10, unit: ':1', color: '#C2A15A', benchmark: 5.4 },
    { label: 'Whitespace %', value: 38.1, max: 70, unit: '%', color: '#6B7D5B', benchmark: 35 },
  ];
  return (
    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6B7D5B', textTransform: 'uppercase' }}>Measurement Engine</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#29251F', fontFamily: 'Playfair Display, serif', marginTop: '0.2rem' }}>Visual Properties</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {metrics.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.18rem' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#695F52' }}>{m.label}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: m.color }}>{m.value}{m.unit}</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(m.benchmark / m.max) * 100}%`, width: 2, background: 'rgba(0,0,0,0.2)', zIndex: 2 }} />
              <motion.div initial={{ width: 0 }} animate={{ width: `${(m.value / m.max) * 100}%` }} transition={{ delay: 0.4 + i * 0.12, duration: 0.8 }} style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${m.color}88, ${m.color})` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.12rem' }}>
              <span style={{ fontSize: '0.5rem', color: '#9E8E7C' }}>0</span>
              <span style={{ fontSize: '0.5rem', color: '#9E8E7C' }}>Avg: {m.benchmark}{m.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', padding: '0.65rem', borderRadius: 10, background: 'rgba(27,67,50,0.06)', border: '1px solid rgba(27,67,50,0.15)' }}>
        <div style={{ fontSize: '0.56rem', color: '#6B7D5B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Score Formula</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          {['Measurements', '→', 'Statistics', '→', 'Score'].map((t, i) => (
            <div key={i} style={{ padding: '0.22rem 0.4rem', borderRadius: 4, background: t === '→' ? 'transparent' : '#1B4332', color: t === '→' ? '#9E8E7C' : '#fff', fontSize: '0.56rem', fontWeight: t === '→' ? 400 : 700 }}>{t}</div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.55rem', color: '#9E8E7C', fontStyle: 'italic' }}>Transparent mathematics, not a black box</div>
      </div>
    </div>
  );
}

function ReportContent() {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 600); return () => clearTimeout(t); }, []);
  return (
    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6B7D5B', textTransform: 'uppercase' }}>Cover Report</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#29251F', fontFamily: 'Playfair Display, serif', marginTop: '0.2rem' }}>Your Results</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ position: 'relative', width: 72, height: 72 }}>
          <svg viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="6" />
            <motion.circle cx="36" cy="36" r="28" fill="none" stroke="#1B4332" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28}`} initial={{ strokeDashoffset: 2 * Math.PI * 28 }} animate={{ strokeDashoffset: revealed ? 2 * Math.PI * 28 * 0.22 : 2 * Math.PI * 28 }} transition={{ delay: 0.3, duration: 1.2, ease: 'easeOut' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: revealed ? 1 : 0 }} transition={{ delay: 0.8 }} style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B4332', lineHeight: 1 }}>78</motion.div>
            <div style={{ fontSize: '0.46rem', color: '#9E8E7C' }}>/ 100</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#29251F' }}>76th Percentile</div>
          <div style={{ fontSize: '0.56rem', color: '#9E8E7C' }}>Better than 76% of covers</div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.56rem', color: '#1B4332', fontWeight: 700 }}>◉ Above benchmark</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
        {[{ label: 'Title Legibility', score: 85, color: '#1B4332' }, { label: 'Contrast', score: 72, color: '#C2A15A' }, { label: 'Whitespace', score: 78, color: '#6B7D5B' }, { label: 'Layout Zones', score: 69, color: '#8B6F52' }].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.56rem', color: '#695F52', width: 84, flexShrink: 0 }}>{item.label}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }} style={{ height: '100%', borderRadius: 99, background: item.color }} />
            </div>
            <span style={{ fontSize: '0.56rem', fontWeight: 700, color: item.color, width: 20, textAlign: 'right' }}>{item.score}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.35rem' }}>
        <div style={{ flex: 1, padding: '0.35rem 0.5rem', borderRadius: 7, background: 'rgba(27,67,50,0.06)', border: '1px solid rgba(27,67,50,0.15)', fontSize: '0.54rem', color: '#1B4332', fontWeight: 700, textAlign: 'center' }}>✓ Free Report</div>
        <div style={{ flex: 1.5, padding: '0.35rem 0.5rem', borderRadius: 7, background: 'linear-gradient(90deg, rgba(27,67,50,0.1), rgba(194,161,90,0.1))', border: '1px solid rgba(194,161,90,0.4)', fontSize: '0.54rem', color: '#4A3728', fontWeight: 700, textAlign: 'center' }}>✦ Full Report — Upgrade</div>
      </div>
    </div>
  );
}

function ImproveContent() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6B7D5B', textTransform: 'uppercase' }}>Improvement Loop</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#29251F', fontFamily: 'Playfair Display, serif', marginTop: '0.2rem' }}>Before & After</div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {[{ label: 'Original', score: 61, color: '#8B6F52', emoji: '📕' }, { label: 'Improved', score: 84, color: '#1B4332', emoji: '📗' }].map((item, i) => (
          <motion.div key={i} animate={{ opacity: i === 1 ? (phase >= 2 ? 1 : 0.3) : 1, scale: i === 1 ? (phase >= 2 ? 1 : 0.95) : 1 }} transition={{ duration: 0.6 }} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, background: `${item.color}14`, border: `1px solid ${item.color}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ fontSize: '1.3rem' }}>{item.emoji}</div>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#695F52' }}>{item.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: item.color }}>{item.score}</div>
          </motion.div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
        {[{ icon: '📊', label: 'Review Insights', done: phase >= 1 }, { icon: '✏️', label: 'Redesign Cover', done: phase >= 1 }, { icon: '⬆️', label: 'Re-upload', done: phase >= 2 }, { icon: '🏆', label: 'New Score: 84', done: phase >= 2 }].map((item, i) => (
          <motion.div key={i} animate={{ opacity: item.done ? 1 : 0.3 }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.28rem 0.5rem', borderRadius: 6, background: item.done ? 'rgba(27,67,50,0.07)' : 'rgba(0,0,0,0.03)', transition: 'all 0.4s' }}>
            <span style={{ fontSize: '0.8rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: item.done ? '#1B4332' : '#9E8E7C' }}>{item.label}</span>
            {item.done && <span style={{ marginLeft: 'auto', fontSize: '0.56rem', color: '#1B4332' }}>✓</span>}
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', padding: '0.5rem 0.65rem', borderRadius: 8, background: 'rgba(27,67,50,0.06)', border: '1px solid rgba(27,67,50,0.12)', textAlign: 'center' }}>
        <div style={{ fontSize: '0.58rem', color: '#1B4332', fontWeight: 700 }}>Measure → Improve → Re-measure</div>
        <div style={{ fontSize: '0.52rem', color: '#9E8E7C', marginTop: '0.12rem' }}>Iterate until you are satisfied</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Steps definition
───────────────────────────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, side: 'left',  chapter: '01', title: 'Sign In / Sign Up',            tagline: 'Start your journey',               spine_label: 'SIGN IN',  content: <SignInContent /> },
  { id: 2, side: 'right', chapter: '02', title: 'Create Project & Upload',       tagline: 'Bring your cover to the studio',   spine_label: 'UPLOAD',   content: <UploadContent /> },
  { id: 3, side: 'left',  chapter: '03', title: 'Extract Cover Information',     tagline: 'Read the structure of your cover', spine_label: 'EXTRACT',  content: <ExtractContent /> },
  { id: 4, side: 'right', chapter: '04', title: 'Measure & Score',               tagline: 'Measure what matters',             spine_label: 'MEASURE',  content: <MeasureContent /> },
  { id: 5, side: 'left',  chapter: '05', title: 'Report & Insights',             tagline: 'Understand your cover',            spine_label: 'REPORT',   content: <ReportContent /> },
  { id: 6, side: 'right', chapter: '06', title: 'Improve & Re-upload',           tagline: 'Make your cover better',           spine_label: 'IMPROVE',  content: <ImproveContent /> },
];

/* ─────────────────────────────────────────────────────────────────────────────
   3D Book Component — Fixed geometry
   Structure: Spine (left edge) + Pages (behind cover) + Cover (full width, opens right→left)
───────────────────────────────────────────────────────────────────────────── */
function Book3D({ step, theme, isLeft, scrollProgress }) {
  /*
   * Left-side books:  spine on left, cover opens LEFTWARD  (-170°) around left edge
   * Right-side books: spine on right, cover opens RIGHTWARD (+170°) around right edge
   *   → cover always folds AWAY from the center text panel, never overlapping it.
   */
  const openDeg = useTransform(
    scrollProgress,
    [0.08, 0.38, 0.65, 0.94],
    isLeft ? [2, -170, -170, -18] : [-2, 170, 170, 18]
  );
  const contentOpacity = useTransform(scrollProgress, [0.3, 0.52], [0, 1]);
  const bookOpacity = useTransform(scrollProgress, [0, 0.1, 0.9, 1], [0.35, 1, 1, 0.35]);
  const bookY       = useTransform(scrollProgress, [0, 0.18, 0.82, 1], [36, 0, 0, -24]);
  const bookScale   = useTransform(scrollProgress, [0, 0.1, 0.9, 1], [0.94, 1, 1, 0.94]);

  const springOpen    = useSpring(openDeg,      { stiffness: 52, damping: 20 });
  const springOpacity = useSpring(bookOpacity,  { stiffness: 80, damping: 25 });
  const springY       = useSpring(bookY,        { stiffness: 52, damping: 20 });
  const springScale   = useSpring(bookScale,    { stiffness: 70, damping: 22 });
  const springContent = useSpring(contentOpacity, { stiffness: 80, damping: 28 });

  /* Proper hardcover book proportions */
  const SPINE_W = 20;   /* visible spine thickness */
  const COVER_W = 168;  /* full cover/page width  */
  const H       = 240;  /* book height            */

  return (
    <motion.div
      style={{
        opacity: springOpacity,
        y: springY,
        scale: springScale,
        /* perspective must wrap the preserve-3d child */
        perspective: 1100,
        /* right-side books tilt toward center; shift origin accordingly */
        perspectiveOrigin: isLeft ? '60% 50%' : '40% 50%',
        display: 'inline-block',
      }}
    >
      {/* ── Outer group giving whole book a subtle angled tilt ── */}
      <div
        style={{
          width: SPINE_W + COVER_W,
          height: H,
          position: 'relative',
          transformStyle: 'preserve-3d',
          /* mirror tilt direction: left books lean right, right books lean left (toward center) */
          transform: isLeft ? 'rotateX(3deg) rotateY(-6deg)' : 'rotateX(3deg) rotateY(6deg)',
          /* mirror shadow: left books shadow right, right books shadow left (inward) */
          filter: isLeft
            ? 'drop-shadow(-10px 18px 36px rgba(41,37,31,0.38))'
            : 'drop-shadow(10px 18px 36px rgba(41,37,31,0.38))',
        }}
      >
        {/*
         * ── 1. Spine ──
         * Left books:  spine on the LEFT  (near viewport left edge)
         * Right books: spine on the RIGHT (near viewport right edge, away from text)
         */}
        <div
          style={{
            position: 'absolute',
            ...(isLeft
              ? { left: 0 }
              : { right: 0 }),
            top: 0,
            width: SPINE_W,
            height: H,
            background: `linear-gradient(180deg, ${theme.spine} 0%, ${theme.cover} 100%)`,
            borderRadius: isLeft ? '5px 0 0 5px' : '0 5px 5px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isLeft
              ? 'inset -3px 0 6px rgba(0,0,0,0.25), 2px 0 0 rgba(0,0,0,0.08)'
              : 'inset 3px 0 6px rgba(0,0,0,0.25), -2px 0 0 rgba(0,0,0,0.08)',
            zIndex: 2,
          }}
        >
          <div
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: '0.42rem',
              fontWeight: 800,
              letterSpacing: '0.22em',
              color: theme.accent,
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            {step.spine_label}
          </div>
        </div>

        {/*
         * ── 2. Pages block ──
         * Left books:  pages to the RIGHT of the spine
         * Right books: pages to the LEFT  of the spine
         */}
        <div
          style={{
            position: 'absolute',
            ...(isLeft
              ? { left: SPINE_W }
              : { left: 0 }),
            top: 0,
            width: COVER_W,
            height: H,
            background: 'linear-gradient(108deg, #EEE4CC 0%, #FAF7F0 18%, #F7F2E8 100%)',
            borderRadius: isLeft ? '0 5px 5px 0' : '5px 0 0 5px',
            overflow: 'hidden',
            zIndex: 1,
            boxShadow: isLeft
              ? 'inset 4px 0 10px rgba(0,0,0,0.08)'
              : 'inset -4px 0 10px rgba(0,0,0,0.08)',
          }}
        >
          {/* Faint ruled lines (visible briefly before content appears) */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                top: `${7 + i * 8}%`,
                height: 1,
                background: 'rgba(0,0,0,0.055)',
                borderRadius: 1,
              }}
            />
          ))}

          {/* Content fades in as cover opens */}
          <motion.div style={{ opacity: springContent, height: '100%', overflow: 'hidden' }}>
            {step.content}
          </motion.div>
        </div>

        {/*
         * ── 3. Front cover ──
         * Left books:  cover sits right of spine, opens around LEFT  edge (-170°)
         * Right books: cover sits left  of spine, opens around RIGHT edge (+170°)
         * Both covers fold AWAY from the center text panel.
         */}
        <motion.div
          style={{
            position: 'absolute',
            ...(isLeft
              ? { left: SPINE_W }
              : { left: 0 }),
            top: 0,
            width: COVER_W,
            height: H,
            transformOrigin: isLeft ? 'left center' : 'right center',
            transformStyle: 'preserve-3d',
            rotateY: springOpen,
            zIndex: 10,
          }}
        >
          {/* ─ Front face of cover (closed state) ─ */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(155deg, ${theme.cover} 0%, ${theme.spine} 100%)`,
              borderRadius: isLeft ? '0 5px 5px 0' : '5px 0 0 5px',
              backfaceVisibility: 'hidden',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.4rem 1rem',
              boxShadow: isLeft
                ? '3px 0 10px rgba(0,0,0,0.18)'
                : '-3px 0 10px rgba(0,0,0,0.18)',
            }}
          >
            {/* Top rule */}
            <div style={{ position: 'absolute', top: 13, left: 13, right: 13, height: 1, background: `${theme.accent}99` }} />
            {/* Bottom rule */}
            <div style={{ position: 'absolute', bottom: 13, left: 13, right: 13, height: 1, background: `${theme.accent}99` }} />
            {/* Corner ornaments */}
            <div style={{ position: 'absolute', top: 9, left: 9, width: 10, height: 10, borderTop: `2px solid ${theme.accent}88`, borderLeft: `2px solid ${theme.accent}88` }} />
            <div style={{ position: 'absolute', top: 9, right: 9, width: 10, height: 10, borderTop: `2px solid ${theme.accent}88`, borderRight: `2px solid ${theme.accent}88` }} />
            <div style={{ position: 'absolute', bottom: 9, left: 9, width: 10, height: 10, borderBottom: `2px solid ${theme.accent}88`, borderLeft: `2px solid ${theme.accent}88` }} />
            <div style={{ position: 'absolute', bottom: 9, right: 9, width: 10, height: 10, borderBottom: `2px solid ${theme.accent}88`, borderRight: `2px solid ${theme.accent}88` }} />
            {/* Chapter */}
            <div style={{ fontSize: '0.5rem', fontWeight: 800, letterSpacing: '0.22em', color: `${theme.accent}`, textTransform: 'uppercase', marginBottom: '0.55rem', opacity: 0.9 }}>{step.chapter}</div>
            {/* Title */}
            <div style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'Playfair Display, serif', color: theme.text, textAlign: 'center', lineHeight: 1.24, maxWidth: 130 }}>{step.title}</div>
            {/* Divider */}
            <div style={{ width: 32, height: 2, background: theme.accent, borderRadius: 1, margin: '0.55rem auto', opacity: 0.9 }} />
            {/* Tagline */}
            <div style={{ fontSize: '0.54rem', color: `${theme.text}bb`, textAlign: 'center', fontStyle: 'italic', lineHeight: 1.4, maxWidth: 120 }}>{step.tagline}</div>
          </div>

          {/* ─ Inner face of cover (seen from behind when book is open) ─ */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(160deg, #EDE3CC, #F5EDD8)',
              borderRadius: isLeft ? '0 5px 5px 0' : '5px 0 0 5px',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          />
        </motion.div>

        {/* ── 4. Page-thickness top edge illusion ── */}
        <div
          style={{
            position: 'absolute',
            ...(isLeft ? { left: SPINE_W + 2, right: 1 } : { left: 1, right: SPINE_W + 2 }),
            top: -3,
            height: 3,
            background: 'linear-gradient(180deg, #F5EDD8 0%, #E8DDCA 100%)',
            borderRadius: isLeft ? '2px 4px 0 0' : '4px 2px 0 0',
            opacity: 0.8,
          }}
        />
        {/* Bottom edge */}
        <div
          style={{
            position: 'absolute',
            ...(isLeft ? { left: SPINE_W + 2, right: 1 } : { left: 1, right: SPINE_W + 2 }),
            bottom: -3,
            height: 3,
            background: 'linear-gradient(0deg, #DDD2BA 0%, #EDE3CC 100%)',
            borderRadius: isLeft ? '0 0 4px 2px' : '0 0 2px 4px',
            opacity: 0.8,
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Text panel
───────────────────────────────────────────────────────────────────────────── */
function TextPanel({ step, alignRight, scrollProgress }) {
  const x = useTransform(scrollProgress, [0.05, 0.35], [alignRight ? -30 : 30, 0]);
  const opacity = useTransform(scrollProgress, [0.05, 0.35, 0.75, 0.95], [0, 1, 1, 0]);
  const springX = useSpring(x, { stiffness: 80, damping: 22 });

  return (
    <motion.div style={{ maxWidth: 300, opacity, x: springX, textAlign: alignRight ? 'right' : 'left' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B7D5B', marginBottom: '0.5rem' }}>Chapter {step.chapter}</div>
      <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 700, fontFamily: 'Playfair Display, Georgia, serif', color: '#29251F', lineHeight: 1.18, marginBottom: '0.65rem' }}>{step.title}</h2>
      <div style={{ width: 34, height: 3, borderRadius: 2, background: '#C2A15A', marginBottom: '0.65rem', marginLeft: alignRight ? 'auto' : 0 }} />
      <p style={{ fontSize: '0.9rem', color: '#695F52', lineHeight: 1.65, fontStyle: 'italic', fontFamily: 'Playfair Display, Georgia, serif' }}>"{step.tagline}"</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Timeline node
───────────────────────────────────────────────────────────────────────────── */
function TimelineNode({ index, isActive, theme }) {
  return (
    <motion.div
      animate={{ scale: isActive ? 1.12 : 1, backgroundColor: isActive ? theme.cover : '#EDE7DB', boxShadow: isActive ? `0 0 22px ${theme.cover}55, 0 0 0 5px ${theme.accent}33` : '0 2px 8px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.45 }}
      style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${isActive ? theme.accent : '#D5C9B5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 5 }}
    >
      <motion.span animate={{ color: isActive ? theme.accent : '#9E8E7C' }} style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'Playfair Display, serif' }}>
        {String(index + 1).padStart(2, '0')}
      </motion.span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Book section
───────────────────────────────────────────────────────────────────────────── */
function BookSection({ step, index, theme }) {
  const ref = useRef(null);
  const isLeft = step.side === 'left';
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const isInView = useInView(ref, { margin: '-18% 0px -18% 0px' });

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        /* Tight sections — no 100vh gaps */
        padding: '4.5rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: index % 2 === 0
          ? 'transparent'
          : 'radial-gradient(ellipse at 80% 50%, rgba(194,161,90,0.04) 0%, transparent 65%)',
        /* allow 3-D book shadows to breathe without clipping */
        overflow: 'visible',
      }}
    >
      <div
        className="wf-book-section-grid"
        style={{ width: '100%', maxWidth: 1080, margin: '0 auto', padding: '0 2rem', overflow: 'visible' }}
      >
        {/* Left column */}
        <div className="wf-left-col" style={{ display: 'flex', justifyContent: 'flex-end', overflow: 'visible' }}>
          {isLeft
            ? <Book3D step={step} theme={theme} isLeft={true} scrollProgress={scrollYProgress} />
            : <TextPanel step={step} alignRight={true} scrollProgress={scrollYProgress} />}
        </div>

        {/* Timeline node */}
        <div className="wf-timeline-node-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
          <TimelineNode index={index} isActive={isInView} theme={theme} />
        </div>

        {/* Right column — extra right padding so 3-D book shadow isn't clipped */}
        <div
          className="wf-right-col"
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            overflow: 'visible',
            /* right-side books have a 3-D tilt + drop-shadow that bleeds right;
               pad enough space so the shadow isn't cut off */
            paddingRight: !isLeft ? '2.5rem' : 0,
          }}
        >
          {isLeft
            ? <TextPanel step={step} alignRight={false} scrollProgress={scrollYProgress} />
            : <Book3D step={step} theme={theme} isLeft={false} scrollProgress={scrollYProgress} />}
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Vertical timeline line
───────────────────────────────────────────────────────────────────────────── */
function TimelineLine({ containerRef }) {
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const scaleY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), { stiffness: 35, damping: 18 });

  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 2, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderLeft: '2px dashed rgba(194,161,90,0.22)' }} />
      <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, #1B433200 0%, #1B4332bb 25%, #C2A15Abb 75%, #1B433200 100%)', scaleY, transformOrigin: 'top' }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero header
───────────────────────────────────────────────────────────────────────────── */
function WorkflowHero() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem 3.5rem', position: 'relative' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.4rem', color: '#6B7D5B' }}>
        <div style={{ width: 52, height: 1, background: 'linear-gradient(90deg, transparent, #C2A15A)' }} />
        <span style={{ fontSize: '1.4rem' }}>📚</span>
        <div style={{ width: 52, height: 1, background: 'linear-gradient(90deg, #C2A15A, transparent)' }} />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6B7D5B', marginBottom: '0.7rem' }}>
        BookCover Doctor — Workflow
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)', fontWeight: 700, fontFamily: 'Playfair Display, Georgia, serif', color: '#29251F', lineHeight: 1.12, marginBottom: '1rem', letterSpacing: '-0.01em' }}>
        From Upload to<br />Actionable Insights
      </motion.h1>

      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.55, duration: 0.7 }} style={{ width: 60, height: 3, background: '#C2A15A', borderRadius: 2, margin: '0 auto 1.15rem' }} />

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.7 }} style={{ fontSize: '0.95rem', color: '#695F52', maxWidth: 500, margin: '0 auto 2.4rem', lineHeight: 1.65 }}>
        Scroll through the story. Each book reveals one chapter of your cover's journey — from first upload to a better score.
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05, duration: 0.6 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', color: '#9E8E7C' }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scroll to begin</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }} style={{ fontSize: '0.9rem' }}>↓</motion.div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Final scene
───────────────────────────────────────────────────────────────────────────── */
function FinalScene() {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-10% 0px' });
  const flowSteps = ['Sign In', 'Create Project', 'Upload', 'Extract', 'Measure', 'Compare', 'Score', 'Improve'];

  return (
    <section ref={ref} style={{ padding: '7rem 2rem 6rem', textAlign: 'center', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.9rem', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={isInView ? { scale: 1, opacity: 1 } : {}} transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }} style={{ width: 12, height: 12, borderRadius: '50%', background: BOOK_THEMES[i].cover }} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.8 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.28rem', marginBottom: '3.5rem' }}>
        {flowSteps.map((label, i) => (
          <React.Fragment key={i}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }} style={{ padding: '0.38rem 0.85rem', borderRadius: 99, background: BOOK_THEMES[Math.min(i, 5)].cover, color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em' }}>{label}</motion.div>
            {i < flowSteps.length - 1 && <motion.span initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6 + i * 0.08 }} style={{ fontSize: '0.8rem', color: '#C2A15A', fontWeight: 700 }}>→</motion.span>}
          </React.Fragment>
        ))}
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.2, duration: 0.8 }} style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', fontWeight: 700, fontFamily: 'Playfair Display, Georgia, serif', color: '#29251F', lineHeight: 1.15, marginBottom: '1rem' }}>
        Better covers.<br />Higher scores.<br />More readers.
      </motion.h2>

      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 1.55, duration: 0.8 }} style={{ fontSize: '0.95rem', color: '#695F52', fontStyle: 'italic', letterSpacing: '0.02em', marginBottom: '2.5rem' }}>
        Transparent measurements. Explainable scoring.
      </motion.p>

      <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={isInView ? { scaleX: 1, opacity: 1 } : {}} transition={{ delay: 1.9, duration: 0.8 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#C2A15A' }}>
        <div style={{ width: 56, height: 1, background: '#C2A15A' }} />
        <span style={{ fontSize: '1rem' }}>❧</span>
        <div style={{ width: 56, height: 1, background: '#C2A15A' }} />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Mobile responsive styles injected globally (scoped to .wf- prefix)
───────────────────────────────────────────────────────────────────────────── */
const WF_STYLES = `
  .wf-book-section-grid {
    display: grid;
    grid-template-columns: 1fr 60px 1fr;
    align-items: center;
    gap: 2.5rem;
    overflow: visible;
  }
  .wf-left-col, .wf-right-col {
    overflow: visible;
  }
  @media (max-width: 768px) {
    .wf-book-section-grid {
      grid-template-columns: 1fr !important;
      grid-template-rows: auto auto auto !important;
      gap: 1.5rem !important;
    }
    .wf-left-col, .wf-right-col {
      justify-content: center !important;
      padding-right: 0 !important;
    }
    .wf-timeline-node-wrap {
      order: -1;
    }
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────────────────── */
export default function WorkflowsPage({ onNavigate }) {
  const booksRef = useRef(null);

  return (
    /* Full-bleed escape from AppShell's maxWidth/padding */
    <div style={{
      position: 'relative',
      marginLeft:  'calc(-1.25rem)',
      marginRight: 'calc(-1.25rem)',
      /* hidden on x to prevent page scroll, but sections use overflow:visible
         so 3-D book shadows are only clipped at this outermost boundary */
      overflowX: 'clip',
    }}>
      {/* Inject scoped responsive styles */}
      <style>{WF_STYLES}</style>

      {/* Main storybook canvas */}
      <div style={{
        position: 'relative',
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(27,67,50,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 95% 50%, rgba(194,161,90,0.06) 0%, transparent 50%),
          #F5F0E6
        `,
        minHeight: '100vh',
      }}>
        <WorkflowHero />

        {/* Book story area */}
        <div ref={booksRef} style={{ position: 'relative' }}>
          <TimelineLine containerRef={booksRef} />
          {STEPS.map((step, i) => (
            <BookSection key={step.id} step={step} index={i} theme={BOOK_THEMES[i]} />
          ))}
        </div>

        <FinalScene />
      </div>
    </div>
  );
}
