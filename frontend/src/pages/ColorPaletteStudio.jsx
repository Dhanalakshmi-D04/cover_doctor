import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getReport, imageUrl, getColorAdvice } from "../api/client";
import { createCoverSvgDataUrl } from "../data/bestsellersData";

const GENRES = [
  "Psychological Thriller",
  "Romance",
  "Sci-Fi / Fantasy",
  "Non-Fiction / Business",
  "Self-Help",
  "Horror",
  "Mystery",
  "Historical Fiction",
];

function hexToHSL(H) {
  if (!H || H.length < 4) return "hsl(0, 0%, 50%)";
  let r = 0, g = 0, b = 0;
  if (H.length === 4) {
    r = "0x" + H[1] + H[1]; g = "0x" + H[2] + H[2]; b = "0x" + H[3] + H[3];
  } else if (H.length === 7) {
    r = "0x" + H[1] + H[2]; g = "0x" + H[3] + H[4]; b = "0x" + H[5] + H[6];
  }
  r /= 255; g /= 255; b /= 255;
  const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let h = 0, s = 0, l = (cmax + cmin) / 2;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return `hsl(${h}, ${+(s * 100).toFixed(1)}%, ${+(l * 100).toFixed(1)}%)`;
}

export default function ColorPaletteStudio({ coverId }) {
  const [copiedHex, setCopiedHex] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState("Psychological Thriller");
  const [advice, setAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", coverId],
    queryFn: () => getReport(coverId),
    enabled: !!coverId,
  });

  if (!coverId) {
    return (
      <div className="spring-card" style={{ textAlign: "center", padding: "4rem 2rem", margin: "2rem auto", maxWidth: "600px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎨</div>
        <h3 style={{ color: "var(--theme-primary)", fontFamily: "var(--font-serif)" }}>No Cover Selected</h3>
        <p style={{ color: "var(--theme-text-muted)", marginTop: "0.5rem" }}>
          Please upload a cover and run the analysis first to extract its color palette.
        </p>
      </div>
    );
  }

  if (isLoading) return <div style={{ padding: "4rem", textAlign: "center" }}>Extracting colors from your cover...</div>;
  if (error) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--accent-danger)" }}>Error loading report.</div>;

  const report = data.report;

  const coverImageSrc = report.filename
    ? imageUrl(coverId, report.filename)
    : createCoverSvgDataUrl({ title: report.title_text || "Unknown", author: "Unknown", style: report.style || "Unknown", bgHex: "#355E3B", textHex: "#F7F3EA", accentHex: "#C89B6D" });

  const hexes = (report.palette_colors || "").split(",").map(h => h.trim()).filter(Boolean);
  const roles = ["Primary", "Secondary", "Tertiary", "Accent", "Background"];
  const pcts  = [45, 25, 15, 10, 5];

  const extractedPalette = hexes.map((hex, i) => ({
    hex: hex.toUpperCase(),
    hsl: hexToHSL(hex),
    pct: pcts[i] ?? 5,
    role: roles[i] ?? "Color",
  }));

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    setAdvice(null);
    try {
      const result = await getColorAdvice(coverId, selectedGenre);
      setAdvice(result);
    } catch (_err) {
      setAdvice({ summary: "Could not get AI suggestions. Please try again.", suggestions: [] });
    } finally {
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <span className="page-badge">🎨 Color Psychology</span>
        <h1 className="page-title">Color Palette Studio</h1>
        <p className="page-subtitle">
          Explore the exact hex codes extracted from your cover and get AI-powered genre color suggestions.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.8rem", alignItems: "start" }}>

        {/* ── LEFT: Image + Bars ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>

          {/* Genre Advisor Card */}
          <div className="spring-card" style={{ background: "var(--theme-olive-light)", borderColor: "var(--theme-olive-border)" }}>
            <h3 style={{ margin: "0 0 0.75rem 0", color: "var(--theme-olive-dark)", fontSize: "1.05rem" }}>
              🤖 AI Genre Color Advisor
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)", marginBottom: "1rem" }}>
              Select your target genre and get specific hex code suggestions based on what top sellers in that genre use.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={selectedGenre}
                onChange={(e) => { setSelectedGenre(e.target.value); setAdvice(null); }}
                className="styled-input"
                style={{ flex: 1, minWidth: "180px", padding: "0.5rem 0.75rem" }}
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <button
                className="btn-olive"
                onClick={handleGetAdvice}
                disabled={loadingAdvice || hexes.length === 0}
                style={{ whiteSpace: "nowrap" }}
              >
                {loadingAdvice ? "Analysing…" : "Get Color Suggestions"}
              </button>
            </div>

            {/* AI Result */}
            {advice && (
              <div style={{ marginTop: "1.2rem", borderTop: "1px solid var(--theme-olive-border)", paddingTop: "1rem" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--theme-ink)", marginBottom: "1rem", lineHeight: 1.6 }}>
                  {advice.summary}
                </p>
                {advice.suggestions && advice.suggestions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {advice.suggestions.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center", background: "rgba(255,255,255,0.5)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-olive-border)" }}>
                        {/* Current swatch */}
                        <div style={{ textAlign: "center" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: s.current_hex, border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", margin: "0 auto 4px" }} />
                          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "var(--theme-muted)" }}>{s.current_hex}</span>
                        </div>
                        <div style={{ fontSize: "1.2rem", color: "var(--theme-muted)" }}>→</div>
                        {/* Suggested swatch */}
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{ width: "36px", height: "36px", borderRadius: "50%", background: s.suggested_hex, border: "2px solid var(--theme-olive)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", margin: "0 auto 4px", cursor: "pointer" }}
                            onClick={() => copyToClipboard(s.suggested_hex)}
                            title="Click to copy"
                          />
                          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "var(--theme-olive-dark)", fontWeight: 700 }}>
                            {copiedHex === s.suggested_hex ? "COPIED!" : s.suggested_hex}
                          </span>
                        </div>
                        {/* Reason */}
                        <div style={{ flex: 1 }}>
                          <span className="page-badge" style={{ fontSize: "0.65rem", marginBottom: "4px", display: "inline-block" }}>{s.role}</span>
                          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--theme-ink)", lineHeight: 1.5 }}>{s.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image + Color Bars */}
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div className="book-cover-3d" style={{ width: "220px", flexShrink: 0 }}>
              <div className="book-cover-3d-inner" style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
                <img src={coverImageSrc} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "center" }}>
              {extractedPalette.length === 0 ? (
                <p style={{ color: "var(--theme-muted)", fontSize: "0.9rem" }}>No palette data yet. Re-upload this cover after restarting the backend to extract colors.</p>
              ) : extractedPalette.map((color, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "40px", textAlign: "right", fontSize: "0.75rem", fontWeight: 600, color: "var(--theme-muted)" }}>
                    {color.pct}%
                  </div>
                  <div
                    title={`Click to copy ${color.hex}`}
                    style={{ flex: 1, height: "42px", backgroundColor: color.hex, borderRadius: "6px", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)", position: "relative" }}
                    onClick={() => copyToClipboard(color.hex)}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scaleY(1.08)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scaleY(1)"; e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.12)"; }}
                  >
                    {copiedHex === color.hex && (
                      <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)", fontSize: "0.7rem", fontWeight: 700 }}>
                        COPIED!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Swatch List ── */}
        <div className="spring-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.05rem", marginBottom: "1.2rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
            Extracted Swatches
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {extractedPalette.length === 0 ? (
              <p style={{ color: "var(--theme-muted)", fontSize: "0.85rem" }}>Upload a cover to extract colors.</p>
            ) : extractedPalette.map((color, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: color.hex, border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.12)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--theme-muted)", textTransform: "uppercase", marginBottom: "2px" }}>{color.role}</div>
                  <div
                    style={{ fontSize: "0.95rem", fontWeight: 600, fontFamily: "monospace", cursor: "pointer", color: "var(--theme-ink)" }}
                    onClick={() => copyToClipboard(color.hex)}
                    title="Click to copy"
                  >
                    {color.hex}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--theme-muted)", fontFamily: "monospace", marginTop: "2px" }}>{color.hsl}</div>
                </div>
              </div>
            ))}
          </div>

          {report.color_harmony_score > 0 && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border-glass)", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--theme-olive-dark)" }}>
                {Math.round(report.color_harmony_score)}
              </div>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--theme-muted)" }}>
                Harmony Score
              </div>
              {report.color_harmony_explanation && (
                <p style={{ fontSize: "0.8rem", color: "var(--theme-muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>
                  {report.color_harmony_explanation}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
