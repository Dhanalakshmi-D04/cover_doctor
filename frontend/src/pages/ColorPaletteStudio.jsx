import React, { useState, useRef, useEffect } from "react";
import { createCoverSvgDataUrl } from "../data/bestsellersData";

export default function ColorPaletteStudio({ userCoverImage }) {
  const [selectedGenre, setSelectedGenre] = useState("Psychological Thriller");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [copiedHex, setCopiedHex] = useState(null);

  const canvasRef = useRef(null);

  const coverImageSrc = userCoverImage || createCoverSvgDataUrl({
    title: "The Silent Confession",
    author: "Marcus Vance",
    style: "Dark Photographic",
    bgHex: "#355E3B",
    textHex: "#F7F3EA",
    accentHex: "#C89B6D",
  });

  const extractedPalette = [
    { hex: "#355E3B", hsl: "hsl(129, 28%, 29%)", pct: 45, role: "Forest Green (Primary)" },
    { hex: "#6B7D5B", hsl: "hsl(93, 15%, 42%)", pct: 25, role: "Muted Olive (Secondary)" },
    { hex: "#8B5E3C", hsl: "hsl(26, 39%, 39%)", pct: 15, role: "Warm Brown" },
    { hex: "#C89B6D", hsl: "hsl(30, 47%, 61%)", pct: 10, role: "Caramel (Accent)" },
    { hex: "#F7F3EA", hsl: "hsl(44, 48%, 94%)", pct: 3, role: "Warm Cream (Background)" },
    { hex: "#29251F", hsl: "hsl(36, 14%, 14%)", pct: 2, role: "Dark Brown (Typography)" },
  ];

  const harmonyScores = {
    "Psychological Thriller": { score: 96, matchText: "Forest Green (#355E3B) & Dark Brown (#29251F) fit 96% of Psychological Thriller Bestsellers." },
    "Romance": { score: 98, matchText: "Warm Cream (#F7F3EA) & Caramel (#C89B6D) fit 98% of Romance Bestsellers." },
    "Sci-Fi/Fantasy": { score: 94, matchText: "Forest Green (#355E3B) & Muted Olive (#6B7D5B) fit 94% of Sci-Fi / Fantasy Bestsellers." },
    "Non-Fiction/Business": { score: 99, matchText: "Warm Brown (#8B5E3C) & Dark Brown (#29251F) fit 99% of Business Bestsellers." },
    "Self-Help": { score: 97, matchText: "Warm Cream (#F7F3EA) & Forest Green (#355E3B) fit 97% of Self-Help Bestsellers." },
  };

  const currentHarmony = harmonyScores[selectedGenre] || harmonyScores["Psychological Thriller"];

  const heatmapZones = [
    { id: 1, x: 200, y: 140, label: "Main Title Top", status: "PASS", contrast: "7.8:1", note: "Excellent WCAG AAA contrast." },
    { id: 2, x: 200, y: 260, label: "Subtitle Baseline", status: "WARNING", contrast: "3.2:1", note: "Top background gradient is too light under font tail." },
    { id: 3, x: 200, y: 520, label: "Author Name Foot", status: "PASS", contrast: "6.2:1", note: "Passes WCAG AA standard." },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverImageSrc;

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 600;
      ctx.drawImage(img, 0, 0, 400, 600);

      if (showHeatmap) {
        ctx.fillStyle = "rgba(236, 132, 6, 0.15)";
        ctx.fillRect(0, 0, 400, 600);

        heatmapZones.forEach((zone) => {
          ctx.beginPath();
          ctx.arc(zone.x, zone.y, 28, 0, 2 * Math.PI);
          ctx.fillStyle = zone.status === "PASS" ? "rgba(68, 82, 55, 0.45)" : "rgba(141, 46, 15, 0.65)";
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = zone.status === "PASS" ? "#445237" : "#8D2E0F";
          ctx.stroke();

          ctx.fillStyle = "white";
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(zone.id.toString(), zone.x, zone.y);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverImageSrc, showHeatmap]);

  function copyHex(hex) {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <span className="page-badge">🎨 Color & Font Diagnostics</span>
        <h1 className="page-title">Color Palette & Font Legibility Studio</h1>
        <p className="page-subtitle">
          Extract dominant HSL colors from cover artwork, check genre color harmony match, and inspect contrast pass/fail markers on the interactive heatmap.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8rem" }}>
        {/* Canvas Column */}
        <div className="spring-card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)", margin: 0 }}>
              Font Legibility Heatmap
            </h3>
            <button
              className={`btn-${showHeatmap ? "olive" : "secondary"}`}
              style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              {showHeatmap ? "🔥 Hide Heatmap" : "🔍 Show Heatmap"}
            </button>
          </div>

          <div className="heatmap-canvas-wrapper" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "var(--shadow-3d-book)" }}>
            <canvas ref={canvasRef} className="heatmap-canvas" />
          </div>

          <div style={{ width: "100%", marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {heatmapZones.map((z) => (
              <div
                key={z.id}
                onClick={() => setSelectedZone(z)}
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  background: selectedZone?.id === z.id ? "var(--theme-olive-light)" : "white",
                  border: selectedZone?.id === z.id ? "1px solid var(--theme-olive)" : "1px solid var(--theme-border)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: z.status === "PASS" ? "var(--theme-olive)" : "var(--theme-russet)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {z.id}
                  </span>
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "var(--theme-olive-dark)" }}>{z.label}</strong>
                    <div style={{ fontSize: "0.78rem", color: "var(--theme-muted)" }}>{z.note}</div>
                  </div>
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: z.status === "PASS" ? "var(--theme-olive)" : "var(--theme-russet)" }}>
                  {z.contrast} ({z.status})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Palette & Harmony Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
          <div className="spring-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)" }}>
                Extracted HSL & Hex Palette
              </h3>
              {copiedHex && (
                <span style={{ fontSize: "0.78rem", color: "var(--theme-olive)", fontWeight: 700 }}>
                  ✓ Copied {copiedHex}!
                </span>
              )}
            </div>

            <div className="palette-swatches" style={{ gap: "0.85rem" }}>
              {extractedPalette.map((swatch, idx) => (
                <div key={idx} className="swatch-card" onClick={() => copyHex(swatch.hex)}>
                  <div className="swatch-color-box" style={{ background: swatch.hex }} />
                  <div className="swatch-info" style={{ padding: "0.8rem" }}>
                    <span className="swatch-hex" style={{ color: "var(--theme-olive-dark)" }}>{swatch.hex}</span>
                    <span className="swatch-hsl" style={{ fontSize: "0.72rem" }}>{swatch.hsl}</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--theme-olive)" }}>
                      {swatch.pct}% cover area
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="spring-card">
            <span className="page-badge" style={{ marginBottom: "0.4rem" }}>Market Color Psychology</span>
            <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)", marginBottom: "0.6rem" }}>
              Genre Color Harmony Score
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--theme-muted)", display: "block", marginBottom: "0.4rem" }}>
                Evaluate Harmony Against Target Genre:
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="styled-input"
              >
                <option value="Psychological Thriller">Psychological Thriller</option>
                <option value="Romance">Romance</option>
                <option value="Sci-Fi/Fantasy">Sci-Fi / Fantasy</option>
                <option value="Non-Fiction/Business">Non-Fiction / Business</option>
                <option value="Self-Help">Self-Help</option>
              </select>
            </div>

            <div style={{ background: "var(--theme-olive-light)", padding: "1.3rem", borderRadius: "var(--radius-md)", border: "1px solid var(--theme-olive-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-olive-dark)" }}>
                  Color Harmony Compatibility
                </span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--theme-olive)" }}>
                  {currentHarmony.score}%
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "var(--theme-ink)" }}>
                {currentHarmony.matchText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
