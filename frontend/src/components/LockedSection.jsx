import UpgradeButton from "./UpgradeButton";

export default function LockedSection({ title, description, icon = "🔒" }) {
  return (
    <div className="locked-card-container">
      <div className="locked-card-header">
        <div className="locked-card-title-group">
          <span className="locked-icon">{icon}</span>
          <div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--theme-text)" }}>{title}</h4>
            {description && <p className="locked-card-desc" style={{ fontSize: "0.82rem", color: "var(--theme-text-muted)" }}>{description}</p>}
          </div>
        </div>
        <span className="pastel-badge pastel-badge-chocolate" style={{ whiteSpace: "nowrap" }}>Pro Feature</span>
      </div>

      <div className="locked-card-preview-area">
        <div className="fake-data-wireframe">
          <div className="fake-wireframe-bar" style={{ width: "85%" }} />
          <div className="fake-wireframe-bar" style={{ width: "65%" }} />
          <div className="fake-wireframe-bar" style={{ width: "90%" }} />
          <div className="fake-wireframe-grid">
            <div className="fake-grid-box" />
            <div className="fake-grid-box" />
          </div>
        </div>

        <div className="locked-card-overlay">
          <div className="locked-cta-box">
            <p className="locked-cta-text" style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--theme-text)", marginBottom: "0.5rem" }}>
              Unlock <strong>{title}</strong> with Cover Doctor Pro
            </p>
            <UpgradeButton />
          </div>
        </div>
      </div>
    </div>
  );
}
