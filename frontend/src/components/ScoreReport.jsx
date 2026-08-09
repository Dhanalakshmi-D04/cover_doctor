import PercentileBar from "./PercentileBar";
import LockedSection from "./LockedSection";
import VisualBreakdown from "./VisualBreakdown";
import EvolutionTracking from "./EvolutionTracking";
import PillButton from "./PillButton";
import { imageUrl } from "../api/client";

export default function ScoreReport({ plan, report, coverId, onReset, onNavigate }) {
  const isPaid = plan === "paid";
  const roundedScore = Math.round(report.overall_score || 0);

  let scoreBadgeColor = "var(--theme-accent)";
  let scoreBadgeBg = "#FEF3C7";
  let scoreLabel = "Needs Key Adjustments";
  if (roundedScore >= 75) {
    scoreBadgeColor = "#1B4332";
    scoreBadgeBg = "#E8F2EC";
    scoreLabel = "✨ Bestseller Quality Ready";
  } else if (roundedScore >= 50) {
    scoreBadgeColor = "#D97706";
    scoreBadgeBg = "#FEF3C7";
    scoreLabel = "⚡ Good Benchmark Potential";
  } else {
    scoreBadgeColor = "#B91C1C";
    scoreBadgeBg = "#FEE2E2";
    scoreLabel = "⚠️ Key Adjustments Recommended";
  }

  const coverSrc = report.filename ? imageUrl(coverId, report.filename) : null;

  return (
    <div className="score-report-container animate-fade-in">
      {/* Top Header & Actions */}
      <div className="score-report-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn-outline" onClick={onReset} style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
            ← Score Another Cover
          </button>
          <span className={`pastel-badge ${isPaid ? "pastel-badge-forest" : "pastel-badge-butter"}`}>
            {isPaid ? "Pro Diagnostics Report" : "Free Diagnostics Report"}
          </span>
        </div>
        
        {onNavigate && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button className="btn-outline" style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }} onClick={() => onNavigate("explore")}>
              📚 Bestseller Explorer
            </button>
            <button className="btn-outline" style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }} onClick={() => onNavigate("ab-test")}>
              ⚔️ A/B Studio
            </button>
          </div>
        )}
      </div>

      {/* Hero Score Showcase Card */}
      <div className="score-hero-card spring-card">
        <div className="score-hero-grid">
          {/* Left Column: Cover Image Preview */}
          <div className="score-cover-preview-box">
            <div className="book-cover-3d-inner" style={{ maxWidth: "220px", margin: "0 auto" }}>
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={report.title_text || "Uploaded cover"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="cover-fallback-placeholder"
                style={{
                  display: coverSrc ? "none" : "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justify-content: "center",
                  height: "100%",
                  minHeight: "300px",
                  background: "linear-gradient(135deg, #1B4332 0%, #2D1E18 100%)",
                  color: "white",
                  padding: "1.5rem",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📖</div>
                <div style={{ fontFamily: "var(--font-serif)", fontWeight: "700", fontSize: "1.1rem" }}>
                  {report.title_text || "Your Cover"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title & Gauge */}
          <div className="score-hero-info">
            <span className="page-badge">Diagnostic Summary</span>
            <h1 className="score-cover-title">
              Your cover: <span style={{ color: "var(--theme-primary)" }}>"{report.title_text || "Untitled Cover"}"</span>
            </h1>

            <div className="score-gauge-card">
              <div className="score-circle" style={{ borderColor: scoreBadgeColor, background: scoreBadgeBg }}>
                <span className="score-num" style={{ color: scoreBadgeColor }}>{roundedScore}</span>
                <span className="score-total">/100</span>
              </div>

              <div className="score-meta">
                <span className="score-status-tag" style={{ color: scoreBadgeColor, background: scoreBadgeBg }}>
                  {scoreLabel}
                </span>
                <p style={{ fontSize: "0.88rem", color: "var(--theme-text-muted)", marginTop: "0.4rem", lineHeight: "1.4" }}>
                  Calculated against genre standards for typography legibility, contrast ratio, and layout balance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Content */}
      {isPaid ? (
        <div className="score-section spring-card" style={{ marginTop: "2rem" }}>
          <h3 className="section-title">📊 Full Percentile Metrics</h3>
          <div style={{ marginTop: "1.2rem" }}>
            <PercentileBar
              label="Title size"
              value={report.title_height_percent}
              percentile={report.title_height_percentile}
              unit="%"
            />
            <PercentileBar
              label="Contrast"
              value={report.contrast_ratio}
              percentile={report.contrast_percentile}
              unit=":1"
            />
            <PercentileBar
              label="Whitespace"
              value={report.whitespace_percent}
              percentile={report.whitespace_percentile}
              unit="%"
            />
          </div>

          <section className="explanations" style={{ marginTop: "2rem" }}>
            <h3 className="section-title">💡 Why these numbers matter</h3>
            <div className="explanations-grid" style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
              {report.title_explanation && (
                <div className="explanation-card">
                  <strong>📏 Title Legibility:</strong> {report.title_explanation}
                </div>
              )}
              {report.contrast_explanation && (
                <div className="explanation-card">
                  <strong>🎨 Color Contrast:</strong> {report.contrast_explanation}
                </div>
              )}
              {report.whitespace_explanation && (
                <div className="explanation-card">
                  <strong>📐 Layout & Whitespace:</strong> {report.whitespace_explanation}
                </div>
              )}
            </div>
          </section>

          <section style={{ marginTop: "2.5rem" }}>
            <h3 className="section-title">👁️ Visual Breakdown Mockups</h3>
            <VisualBreakdown imageSrc={coverSrc} />
          </section>

          <section style={{ marginTop: "2.5rem" }}>
            <h3 className="section-title">📈 Version Evolution</h3>
            <EvolutionTracking bookProjectId={report.book_project_id} />
          </section>
        </div>
      ) : (
        <>
          {/* Top 3 Actionable Improvements Section */}
          <div className="spring-card" style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
              <span style={{ fontSize: "1.6rem" }}>🎯</span>
              <h3 className="section-title" style={{ margin: 0 }}>Top 3 Benchmark Recommendations</h3>
            </div>

            <div className="improvements-grid">
              {report.improvements && report.improvements.map((text, i) => (
                <div key={i} className="improvement-card">
                  <div className="improvement-badge">{i + 1}</div>
                  <div className="improvement-content">
                    <p style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--theme-text)", lineHeight: "1.4" }}>
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locked Pro Sections Grid */}
          <div style={{ marginTop: "2.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <span className="pastel-badge pastel-badge-chocolate" style={{ marginBottom: "0.4rem" }}>PRO ANALYTICS</span>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--theme-text)" }}>
                Unlock Complete Bestseller Analytics
              </h3>
              <p style={{ color: "var(--theme-text-muted)", fontSize: "0.95rem" }}>
                Get full percentile rankings, visual Amazon thumbnail previews, and version tracking.
              </p>
            </div>

            <div className="locked-grid">
              <LockedSection
                icon="📊"
                title="Full Percentile Breakdown"
                description="Compare your title size, contrast, and whitespace directly against top 1,000 Amazon bestsellers."
              />
              <LockedSection
                icon="🔍"
                title="Competitive Pattern Summary"
                description="Discover genre color distribution norms, font hierarchy standards, and clutter metrics."
              />
              <LockedSection
                icon="👁️"
                title="Visual Breakdown & Thumbnail Mockups"
                description="Preview your cover as a 100px Amazon thumbnail, search result card, and mobile device display."
              />
              <LockedSection
                icon="📈"
                title="Evolution Tracking"
                description="Track how your score improves across cover revisions (v1, v2, v3) in your book project."
              />
            </div>
          </div>
        </>
      )}

      {/* Footer Action Bar */}
      <div className="score-report-footer spring-card" style={{ marginTop: "2.5rem", textAlign: "center" }}>
        <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>What would you like to do next?</h4>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
          <PillButton onClick={onReset}>
            🔄 Score Another Cover
          </PillButton>
          {onNavigate && (
            <>
              <button className="btn-secondary" onClick={() => onNavigate("explore")}>
                📚 Explore Bestseller Data →
              </button>
              <button className="btn-outline" onClick={() => onNavigate("ab-test")}>
                ⚔️ Run A/B Reader Poll →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
