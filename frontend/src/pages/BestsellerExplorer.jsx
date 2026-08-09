import React, { useState, useEffect } from "react";
import {
  GENRES,
  VISUAL_STYLES,
  BESTSELLER_COVERS,
  GENRE_BENCHMARKS,
  createCoverSvgDataUrl,
} from "../data/bestsellersData";

export default function BestsellerExplorer({ _userCoverId, userCoverImage }) {
  const [selectedGenre, setSelectedGenre] = useState("Romance");
  const [selectedStyle, setSelectedStyle] = useState("All");
  const [compareTarget, setCompareTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Filter covers by genre, style, and search
  const filteredCovers = BESTSELLER_COVERS.filter((cover) => {
    const matchesGenre = cover.genre === selectedGenre;
    const matchesStyle = selectedStyle === "All" || cover.style === selectedStyle;
    const matchesSearch =
      searchQuery === "" ||
      cover.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cover.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesStyle && matchesSearch;
  });

  const N = filteredCovers.length;

  // Reset active coverflow index whenever filters change
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedGenre, selectedStyle, searchQuery]);

  // Circular Offset calculation to ensure books ALWAYS exist on both left and right sides
  function getOffset(idx) {
    if (N <= 1) return 0;
    let diff = idx - activeIndex;
    while (diff > N / 2) diff -= N;
    while (diff < -N / 2) diff += N;
    return diff;
  }

  // Keyboard Arrow navigation for Coverflow
  useEffect(() => {
    function handleKeyDown(e) {
      if (N <= 1) return;
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev - 1 + N) % N);
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev + 1) % N);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [N]);

  const activeCover = filteredCovers[activeIndex] || filteredCovers[0];
  const benchmarkStats = GENRE_BENCHMARKS[selectedGenre] || GENRE_BENCHMARKS["Romance"];

  const sampleUserCover = {
    title: "Your Book Title",
    author: "Author Name",
    avgTitleSizePct: 14.5,
    contrastRatio: 4.2,
    whitespacePct: 22.0,
    imgUrl: userCoverImage || createCoverSvgDataUrl({
      title: "Shadows of Destiny",
      author: "Jane Doe",
      style: "Minimalist",
      bgHex: "#445237",
      textHex: "#ffffff",
      accentHex: "#f7cd75",
    }),
  };

  function handlePrev() {
    if (N <= 1) return;
    setActiveIndex((prev) => (prev - 1 + N) % N);
  }

  function handleNext() {
    if (N <= 1) return;
    setActiveIndex((prev) => (prev + 1) % N);
  }

  return (
    <div className="animate-fade-in">
      {/* Header Banner */}
      <div className="page-header">
        <span className="page-badge">📚 3D Bestseller Gallery</span>
        <h1 className="page-title">Genre Bestseller & Benchmark Explorer</h1>
        <p className="page-subtitle">
          Glide horizontally through scraped Amazon bestseller covers in interactive Coverflow. Inspect title sizing %, contrast ratios, and compare your cover directly side-by-side.
        </p>
      </div>

      {/* Genre Benchmark Averages Bar */}
      <div className="spring-card" style={{ marginBottom: "1.8rem", background: "var(--theme-olive-light)", borderColor: "var(--theme-olive-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ color: "var(--theme-olive-dark)", fontWeight: 700, fontSize: "1.2rem", fontFamily: "var(--font-serif)" }}>
              {selectedGenre} Market Benchmark Averages
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)" }}>
              Top Colors: {benchmarkStats.topColors.join(" • ")}
            </p>
          </div>

          <div style={{ display: "flex", gap: "1.8rem" }}>
            <div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--theme-olive-dark)" }}>
                {benchmarkStats.avgTitleSizePct}%
              </div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--theme-muted)" }}>
                Avg Title Size
              </div>
            </div>
            <div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--theme-olive-dark)" }}>
                {benchmarkStats.avgContrastRatio}:1
              </div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--theme-muted)" }}>
                Avg Contrast
              </div>
            </div>
            <div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--theme-olive-dark)" }}>
                {benchmarkStats.avgWhitespacePct}%
              </div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--theme-muted)" }}>
                Avg Whitespace
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Genre Tabs Filter */}
      <div style={{ marginBottom: "1.2rem" }}>
        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--theme-muted)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase" }}>
          Select Genre Category:
        </label>
        <div className="tab-group">
          {GENRES.map((g) => (
            <button
              key={g.id}
              className={`tab-btn ${selectedGenre === g.id ? "active" : ""}`}
              onClick={() => setSelectedGenre(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Style Tabs & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--theme-muted)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase" }}>
            Filter Visual Style:
          </label>
          <div className="tab-group" style={{ marginBottom: 0 }}>
            {VISUAL_STYLES.map((st) => (
              <button
                key={st.id}
                className={`tab-btn tab-btn-secondary ${selectedStyle === st.id ? "active" : ""}`}
                onClick={() => setSelectedStyle(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="Search titles or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="styled-input"
            style={{ minWidth: "240px" }}
          />
        </div>
      </div>

      {/* 3D HORIZONTAL COVERFLOW GALLERY STAGE (Soft Subtle Blur & High Visibility on Both Sides) */}
      {filteredCovers.length === 0 ? (
        <div className="spring-card" style={{ textAlign: "center", padding: "3.5rem" }}>
          <p style={{ color: "var(--theme-muted)" }}>No bestsellers matching the selected filter criteria.</p>
        </div>
      ) : (
        <div>
          <div className="coverflow-stage">
            {/* Left & Right Nav Arrows */}
            <button className="coverflow-nav-btn left" onClick={handlePrev} title="Previous Cover (Left Arrow)">
              ‹
            </button>
            <button className="coverflow-nav-btn right" onClick={handleNext} title="Next Cover (Right Arrow)">
              ›
            </button>

            <div className="coverflow-track">
              {filteredCovers.map((cover, idx) => {
                const offset = getOffset(idx);
                const isCenter = offset === 0;

                // Subtle soft blur (1.5px & 3px) with high visibility (0.88 & 0.65 opacity)
                let transformStyle = "";
                let filterStyle = "none";
                let opacityVal = 0;
                let zIndexVal = 0;

                if (offset === 0) {
                  transformStyle = "translateX(0px) scale(1.12)";
                  filterStyle = "blur(0px)";
                  opacityVal = 1;
                  zIndexVal = 50;
                } else if (offset === -1) {
                  transformStyle = "translateX(-270px) scale(0.96)";
                  filterStyle = "blur(1.5px)";
                  opacityVal = 0.88;
                  zIndexVal = 40;
                } else if (offset === 1) {
                  transformStyle = "translateX(270px) scale(0.96)";
                  filterStyle = "blur(1.5px)";
                  opacityVal = 0.88;
                  zIndexVal = 40;
                } else if (offset === -2) {
                  transformStyle = "translateX(-490px) scale(0.9)";
                  filterStyle = "blur(3px)";
                  opacityVal = 0.65;
                  zIndexVal = 30;
                } else if (offset === 2) {
                  transformStyle = "translateX(490px) scale(0.9)";
                  filterStyle = "blur(3px)";
                  opacityVal = 0.65;
                  zIndexVal = 30;
                } else {
                  transformStyle = offset < 0 ? "translateX(-700px) scale(0.8)" : "translateX(700px) scale(0.8)";
                  filterStyle = "blur(5px)";
                  opacityVal = 0;
                  zIndexVal = 10;
                }

                const imgUrl = createCoverSvgDataUrl({
                  title: cover.title,
                  author: cover.author,
                  style: cover.style,
                  bgHex: cover.bgHex,
                  textHex: cover.textHex,
                  accentHex: cover.accentHex,
                });

                return (
                  <div
                    key={cover.id}
                    className={`coverflow-card ${isCenter ? "active-center" : ""}`}
                    style={{
                      transform: transformStyle,
                      filter: filterStyle,
                      opacity: opacityVal,
                      zIndex: zIndexVal,
                      pointerEvents: Math.abs(offset) > 2 ? "none" : "auto",
                    }}
                    onClick={() => setActiveIndex(idx)}
                  >
                    <img src={imgUrl} alt={cover.title} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coverflow Pagination Dots */}
          <div className="coverflow-dots">
            {filteredCovers.map((_, idx) => (
              <div
                key={idx}
                className={`coverflow-dot ${idx === activeIndex ? "active" : ""}`}
                onClick={() => setActiveIndex(idx)}
              />
            ))}
          </div>

          {/* ACTIVE COVERFLOW SPOTLIGHT INSPECTION CARD */}
          {activeCover && (
            <div className="spring-card animate-fade-in" style={{ marginTop: "2rem", backgroundColor: "var(--bg-glass-card)", borderColor: "var(--border-glass)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                    <span className="page-badge" style={{ background: "var(--theme-amber-light)", color: "var(--theme-amber)", border: "1px solid rgba(236,132,6,0.3)" }}>
                      #{activeCover.rank} Amazon Bestseller
                    </span>
                    <span className="page-badge" style={{ background: "var(--theme-cream)" }}>
                      {activeCover.style}
                    </span>
                  </div>

                  <h2 style={{ fontSize: "1.6rem", color: "var(--theme-olive-dark)", fontFamily: "var(--font-serif)", margin: "0.2rem 0" }}>
                    {activeCover.title}
                  </h2>
                  <p style={{ color: "var(--theme-muted)", fontSize: "0.95rem" }}>
                    by <strong>{activeCover.author}</strong> ({activeCover.genre})
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                  <div className="card-metrics-row" style={{ padding: "0.8rem 1.2rem", gap: "1.2rem" }}>
                    <div>
                      <div className="metric-item-val" style={{ fontSize: "1.2rem" }}>{activeCover.avgTitleSizePct}%</div>
                      <div className="metric-item-lbl">Title Size</div>
                    </div>
                    <div>
                      <div className="metric-item-val" style={{ fontSize: "1.2rem" }}>{activeCover.contrastRatio}:1</div>
                      <div className="metric-item-lbl">Contrast</div>
                    </div>
                    <div>
                      <div className="metric-item-val" style={{ fontSize: "1.2rem" }}>{activeCover.whitespacePct}%</div>
                      <div className="metric-item-lbl">Whitespace</div>
                    </div>
                  </div>

                  <button
                    className="btn-russet"
                    onClick={() => setCompareTarget(activeCover)}
                    style={{ padding: "0.8rem 1.6rem", fontSize: "0.95rem" }}
                  >
                    ⚔️ Compare My Cover vs {activeCover.title}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {compareTarget && (
        <div className="modal-overlay" onClick={() => setCompareTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <span className="page-badge">Side-by-Side Benchmark Analysis</span>
                <h2 style={{ fontSize: "1.6rem", color: "var(--theme-olive-dark)", margin: "0.25rem 0 0 0", fontFamily: "var(--font-serif)" }}>
                  Comparing Your Cover vs. #{compareTarget.rank} Bestseller
                </h2>
              </div>
              <button
                className="btn-secondary"
                onClick={() => setCompareTarget(null)}
                style={{ padding: "0.4rem 0.8rem" }}
              >
                ✕ Close
              </button>
            </div>

            <div className="comparison-container">
              {/* User Cover */}
              <div className="compare-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="page-badge" style={{ background: "var(--theme-russet-light)", color: "var(--theme-russet)" }}>Your Cover</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)" }}>Target Genre: {selectedGenre}</span>
                </div>

                <div className="book-cover-3d">
                  <div className="book-cover-3d-inner">
                    <img src={sampleUserCover.imgUrl} alt="Your cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>

                <div className="card-metrics-row">
                  <div>
                    <div className="metric-item-val">{sampleUserCover.avgTitleSizePct}%</div>
                    <div className="metric-item-lbl">Title Size</div>
                  </div>
                  <div>
                    <div className="metric-item-val">{sampleUserCover.contrastRatio}:1</div>
                    <div className="metric-item-lbl">Contrast</div>
                  </div>
                  <div>
                    <div className="metric-item-val">{sampleUserCover.whitespacePct}%</div>
                    <div className="metric-item-lbl">Whitespace</div>
                  </div>
                </div>
              </div>

              {/* Bestseller Target */}
              <div className="compare-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="page-badge">#{compareTarget.rank} {compareTarget.title}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)" }}>{compareTarget.style}</span>
                </div>

                <div className="book-cover-3d">
                  <div className="book-cover-3d-inner">
                    <img
                      src={createCoverSvgDataUrl({
                        title: compareTarget.title,
                        author: compareTarget.author,
                        style: compareTarget.style,
                        bgHex: compareTarget.bgHex,
                        textHex: compareTarget.textHex,
                        accentHex: compareTarget.accentHex,
                      })}
                      alt={compareTarget.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>

                <div className="card-metrics-row">
                  <div>
                    <div className="metric-item-val">{compareTarget.avgTitleSizePct}%</div>
                    <div className="metric-item-lbl">Title Size</div>
                  </div>
                  <div>
                    <div className="metric-item-val">{compareTarget.contrastRatio}:1</div>
                    <div className="metric-item-lbl">Contrast</div>
                  </div>
                  <div>
                    <div className="metric-item-val">{compareTarget.whitespacePct}%</div>
                    <div className="metric-item-lbl">Whitespace</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
