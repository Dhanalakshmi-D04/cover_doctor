// Expanded Benchmark & Bestseller Covers Dataset for Cover Doctor
export const GENRES = [
  { id: "Romance", label: "Romance" },
  { id: "Psychological Thriller", label: "Psychological Thriller" },
  { id: "Sci-Fi/Fantasy", label: "Sci-Fi / Fantasy" },
  { id: "Non-Fiction/Business", label: "Non-Fiction / Business" },
  { id: "Self-Help", label: "Self-Help" },
];

export const VISUAL_STYLES = [
  { id: "All", label: "All Styles" },
  { id: "Bold Typography", label: "Bold Typography" },
  { id: "Dark Photographic", label: "Dark Photographic" },
  { id: "Minimalist", label: "Minimalist" },
  { id: "Illustrated", label: "Illustrated" },
];

// Helper to generate dynamic SVG book cover image Data URLs with 3D spine aesthetics
export function createCoverSvgDataUrl({ title, author, style, bgHex, textHex, accentHex }) {
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex}" />
        <stop offset="100%" stop-color="${adjustBrightness(bgHex, -35)}" />
      </linearGradient>
      <linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.4)" />
        <stop offset="50%" stop-color="rgba(255,255,255,0.2)" />
        <stop offset="100%" stop-color="transparent" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="400" height="600" fill="url(#grad)" />
    
    <!-- Spine Overlay -->
    <rect width="18" height="600" fill="url(#spine)" />
    
    <!-- Geometric Book Accent Art (No botanical elements) -->
    ${style === 'Bold Typography' ? `
      <rect x="35" y="35" width="330" height="530" fill="none" stroke="${accentHex}" stroke-width="2.5" opacity="0.3" />
      <circle cx="200" cy="300" r="140" fill="none" stroke="${accentHex}" stroke-width="1.5" opacity="0.25" />
    ` : style === 'Dark Photographic' ? `
      <polygon points="200,60 340,520 60,520" fill="${accentHex}" opacity="0.15" />
      <line x1="60" y1="480" x2="340" y2="480" stroke="${accentHex}" stroke-width="2" opacity="0.4" />
    ` : style === 'Illustrated' ? `
      <circle cx="200" cy="230" r="100" fill="${accentHex}" opacity="0.35" />
      <rect x="50" y="360" width="300" height="4" fill="${accentHex}" opacity="0.6" />
    ` : `
      <rect x="60" y="60" width="280" height="480" fill="none" stroke="${accentHex}" stroke-width="1.5" opacity="0.4" />
    `}

    <!-- Title & Author Typography -->
    <g text-anchor="middle">
      <text x="200" y="240" fill="${textHex}" font-family="Playfair Display, Georgia, serif" font-weight="700" font-size="${title.length > 18 ? '26' : '34'}" letter-spacing="-0.5">
        ${breakTitleIntoSpans(title)}
      </text>
      <text x="200" y="515" fill="${textHex}" font-family="Plus Jakarta Sans, sans-serif" font-weight="700" font-size="15" letter-spacing="2" opacity="0.9">
        ${author.toUpperCase()}
      </text>
      <text x="200" y="540" fill="${accentHex}" font-family="Plus Jakarta Sans, sans-serif" font-weight="600" font-size="10" letter-spacing="3" opacity="0.85">
        AMAZON BESTSELLER BENCHMARK
      </text>
    </g>
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

function breakTitleIntoSpans(title) {
  const words = title.split(' ');
  if (words.length <= 2) return title;
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');
  return `<tspan x="200" dy="0">${line1}</tspan><tspan x="200" dy="42">${line2}</tspan>`;
}

function adjustBrightness(hex, percent) {
  let num = parseInt(hex.replace('#',''), 16),
  amt = Math.round(2.55 * percent),
  R = (num >> 16) + amt,
  G = (num >> 8 & 0x00FF) + amt,
  B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// 25+ Scraped Bestseller Covers Dataset across all 5 genres
export const BESTSELLER_COVERS = [
  // ROMANCE
  { id: "rom-1", title: "Love in the Midnight Sky", author: "Elena Rostova", genre: "Romance", style: "Bold Typography", rank: 1, avgTitleSizePct: 22.4, contrastRatio: 6.8, whitespacePct: 41.2, bgHex: "#445237", textHex: "#ffffff", accentHex: "#f7cd75" },
  { id: "rom-2", title: "The Golden Promise", author: "Clara Vance", genre: "Romance", style: "Illustrated", rank: 2, avgTitleSizePct: 19.8, contrastRatio: 5.4, whitespacePct: 38.5, bgHex: "#f9f6f0", textHex: "#8d2e0f", accentHex: "#f7ba04" },
  { id: "rom-3", title: "Forever After Autumn", author: "Nora Thorne", genre: "Romance", style: "Minimalist", rank: 3, avgTitleSizePct: 18.2, contrastRatio: 7.1, whitespacePct: 52.0, bgHex: "#2a3521", textHex: "#f9f6f0", accentHex: "#ec8406" },
  { id: "rom-4", title: "Starlight Passions", author: "Juliet Montgomery", genre: "Romance", style: "Dark Photographic", rank: 4, avgTitleSizePct: 24.0, contrastRatio: 8.1, whitespacePct: 35.0, bgHex: "#321d28", textHex: "#ffffff", accentHex: "#f7cd75" },
  { id: "rom-5", title: "Embers of Desire", author: "Sophia Blake", genre: "Romance", style: "Bold Typography", rank: 5, avgTitleSizePct: 25.1, contrastRatio: 7.9, whitespacePct: 40.0, bgHex: "#8d2e0f", textHex: "#fffbf0", accentHex: "#f7ba04" },

  // PSYCHOLOGICAL THRILLER
  { id: "thr-1", title: "The Silent Confession", author: "Marcus Vance", genre: "Psychological Thriller", style: "Dark Photographic", rank: 1, avgTitleSizePct: 24.1, contrastRatio: 8.9, whitespacePct: 34.0, bgHex: "#1b2420", textHex: "#ffffff", accentHex: "#ec8406" },
  { id: "thr-2", title: "Whispers in the Dark", author: "Hannah Cross", genre: "Psychological Thriller", style: "Bold Typography", rank: 2, avgTitleSizePct: 26.5, contrastRatio: 7.6, whitespacePct: 29.8, bgHex: "#2a3521", textHex: "#f7ba04", accentHex: "#8d2e0f" },
  { id: "thr-3", title: "Don't Look Behind You", author: "David Mercer", genre: "Psychological Thriller", style: "Minimalist", rank: 3, avgTitleSizePct: 21.4, contrastRatio: 9.2, whitespacePct: 45.0, bgHex: "#121714", textHex: "#ffffff", accentHex: "#f7ba04" },
  { id: "thr-4", title: "The Glass House Alibi", author: "Rachel Morgan", genre: "Psychological Thriller", style: "Illustrated", rank: 4, avgTitleSizePct: 20.8, contrastRatio: 6.9, whitespacePct: 38.0, bgHex: "#8d2e0f", textHex: "#f9f6f0", accentHex: "#f7cd75" },
  { id: "thr-5", title: "Deception at Dawn", author: "Victor Sterling", genre: "Psychological Thriller", style: "Dark Photographic", rank: 5, avgTitleSizePct: 27.2, contrastRatio: 8.4, whitespacePct: 31.5, bgHex: "#1e2923", textHex: "#ec8406", accentHex: "#ffffff" },

  // SCI-FI / FANTASY
  { id: "sci-1", title: "Chronicles of Aethelgard", author: "Kaelen Voss", genre: "Sci-Fi/Fantasy", style: "Dark Photographic", rank: 1, avgTitleSizePct: 21.0, contrastRatio: 7.4, whitespacePct: 36.5, bgHex: "#18222d", textHex: "#e6dfd3", accentHex: "#f7cd75" },
  { id: "sci-2", title: "Quantum Horizon", author: "Dr. Sarah Lin", genre: "Sci-Fi/Fantasy", style: "Bold Typography", rank: 2, avgTitleSizePct: 23.8, contrastRatio: 8.2, whitespacePct: 40.1, bgHex: "#445237", textHex: "#f7ba04", accentHex: "#ec8406" },
  { id: "sci-3", title: "The Last Starship Fleet", author: "Orion Vance", genre: "Sci-Fi/Fantasy", style: "Minimalist", rank: 3, avgTitleSizePct: 19.5, contrastRatio: 8.9, whitespacePct: 50.0, bgHex: "#121a22", textHex: "#ffffff", accentHex: "#f7ba04" },
  { id: "sci-4", title: "Realm of Dragonsteel", author: "Toren Blackwood", genre: "Sci-Fi/Fantasy", style: "Illustrated", rank: 4, avgTitleSizePct: 22.9, contrastRatio: 7.1, whitespacePct: 33.2, bgHex: "#8d2e0f", textHex: "#f7cd75", accentHex: "#ffffff" },
  { id: "sci-5", title: "Cybernetic Genesis", author: "Valerie Chen", genre: "Sci-Fi/Fantasy", style: "Dark Photographic", rank: 5, avgTitleSizePct: 25.0, contrastRatio: 8.0, whitespacePct: 37.0, bgHex: "#1c251e", textHex: "#ec8406", accentHex: "#f7cd75" },

  // NON-FICTION / BUSINESS
  { id: "bus-1", title: "The Exponential Mindset", author: "Arthur Pendelton", genre: "Non-Fiction/Business", style: "Minimalist", rank: 1, avgTitleSizePct: 25.2, contrastRatio: 9.1, whitespacePct: 48.0, bgHex: "#ffffff", textHex: "#445237", accentHex: "#ec8406" },
  { id: "bus-2", title: "Capital & Culture", author: "Elena Zhao", genre: "Non-Fiction/Business", style: "Bold Typography", rank: 2, avgTitleSizePct: 27.0, contrastRatio: 8.5, whitespacePct: 44.5, bgHex: "#445237", textHex: "#f9f6f0", accentHex: "#f7cd75" },
  { id: "bus-3", title: "The Founder's Playbook", author: "Marcus Brody", genre: "Non-Fiction/Business", style: "Minimalist", rank: 3, avgTitleSizePct: 26.1, contrastRatio: 8.8, whitespacePct: 51.0, bgHex: "#f9f6f0", textHex: "#8d2e0f", accentHex: "#f7ba04" },
  { id: "bus-4", title: "Agile Leadership 2.0", author: "Diane Ross", genre: "Non-Fiction/Business", style: "Bold Typography", rank: 4, avgTitleSizePct: 28.3, contrastRatio: 9.4, whitespacePct: 42.0, bgHex: "#8d2e0f", textHex: "#ffffff", accentHex: "#ec8406" },
  { id: "bus-5", title: "Scaling High Impact Teams", author: "Robert Sterling", genre: "Non-Fiction/Business", style: "Illustrated", rank: 5, avgTitleSizePct: 24.5, contrastRatio: 7.9, whitespacePct: 46.0, bgHex: "#2a3521", textHex: "#f7ba04", accentHex: "#f7cd75" },

  // SELF-HELP
  { id: "sh-1", title: "Unshakable Calm", author: "Maya Linford", genre: "Self-Help", style: "Minimalist", rank: 1, avgTitleSizePct: 20.5, contrastRatio: 7.8, whitespacePct: 54.2, bgHex: "#eff3ec", textHex: "#445237", accentHex: "#ec8406" },
  { id: "sh-2", title: "The Habit Loop Shift", author: "Dr. Julian Ross", genre: "Self-Help", style: "Bold Typography", rank: 2, avgTitleSizePct: 24.8, contrastRatio: 8.4, whitespacePct: 46.0, bgHex: "#f9f6f0", textHex: "#8d2e0f", accentHex: "#f7ba04" },
  { id: "sh-3", title: "Mastering Inner Peace", author: "Swami Ananda", genre: "Self-Help", style: "Minimalist", rank: 3, avgTitleSizePct: 19.8, contrastRatio: 8.0, whitespacePct: 56.0, bgHex: "#ffffff", textHex: "#445237", accentHex: "#f7cd75" },
  { id: "sh-4", title: "Mindful Momentum", author: "Clara Bennett", genre: "Self-Help", style: "Illustrated", rank: 4, avgTitleSizePct: 22.0, contrastRatio: 7.5, whitespacePct: 49.0, bgHex: "#fef5e9", textHex: "#ec8406", accentHex: "#445237" },
  { id: "sh-5", title: "The Resilience Code", author: "Dr. Ethan Wright", genre: "Self-Help", style: "Bold Typography", rank: 5, avgTitleSizePct: 26.2, contrastRatio: 8.7, whitespacePct: 44.0, bgHex: "#445237", textHex: "#ffffff", accentHex: "#f7ba04" }
];

export const GENRE_BENCHMARKS = {
  "Romance": { avgTitleSizePct: 21.8, avgContrastRatio: 7.1, avgWhitespacePct: 41.0, topColors: ["Deep Russet", "Honey Gold", "Warm Cream"] },
  "Psychological Thriller": { avgTitleSizePct: 25.1, avgContrastRatio: 8.2, avgWhitespacePct: 35.5, topColors: ["Forest Dark", "Sunset Amber", "Golden Yellow"] },
  "Sci-Fi/Fantasy": { avgTitleSizePct: 22.4, avgContrastRatio: 8.0, avgWhitespacePct: 39.0, topColors: ["Cosmic Forest", "Star Gold", "Amber Orange"] },
  "Non-Fiction/Business": { avgTitleSizePct: 26.8, avgContrastRatio: 8.7, avgWhitespacePct: 46.0, topColors: ["Executive Olive", "Clean White", "Russet Accent"] },
  "Self-Help": { avgTitleSizePct: 22.6, avgContrastRatio: 7.9, avgWhitespacePct: 50.0, topColors: ["Soft Mint", "Warm Honey Gold", "Sunset Amber"] },
};
