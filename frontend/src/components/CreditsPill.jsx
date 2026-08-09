import React, { useState } from "react";

export default function CreditsPill({ credits = null }) {
  const [open, setOpen] = useState(false);
  const display = credits == null ? "Free" : credits;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="pill-button pill-button--muted"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-label="Credits info"
        style={{ fontWeight: 700, display: "inline-flex", gap: "0.5rem" }}
      >
        <span style={{ fontSize: "0.95rem" }}>🪙</span>
        <span style={{ fontSize: "0.95rem" }}>{display}</span>
        <span style={{ fontSize: "0.85rem", opacity: 0.85, marginLeft: "0.4rem" }}>credits</span>
        <span style={{ fontSize: "0.9rem", marginLeft: "0.25rem", opacity: 0.9 }}>i</span>
      </button>

      {open && (
        <div className="credits-tooltip">
          <div style={{ fontWeight: 800, marginBottom: "0.5rem", color: "var(--ct-cream)" }}>Credit Usage:</div>
          <ul style={{ paddingLeft: "1rem", lineHeight: 1.4 }}>
            <li>Each analysis costs 1 credit</li>
            <li>Credits are purchased in packs and may expire</li>
            <li>Unused credits roll into monthly quotas for subscriptions</li>
          </ul>
        </div>
      )}
    </div>
  );
}
