import React, { useState } from "react";
import { createCoverSvgDataUrl } from "../data/bestsellersData";

export default function ExportStudio({ userCoverImage }) {
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [designerNotes, setDesignerNotes] = useState("");

  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: "Increase title text height from 11% to >18% for mobile thumbnail legibility.", category: "Typography", checked: false },
    { id: 2, text: "Darken top background gradient for at least 4.5:1 WCAG contrast ratio.", category: "Contrast", checked: false },
    { id: 3, text: "Increase negative space around author name by 15% to improve visual focus.", category: "Whitespace", checked: false },
    { id: 4, text: "Align primary title color hex with #F7BA04 to fit top 88% genre bestsellers.", category: "Color Psychology", checked: false },
    { id: 5, text: "Ensure subtitle font weight is at least Semi-Bold (600) so it doesn't blur on Kindle devices.", category: "Legibility", checked: false },
  ]);

  const coverImgSrc = userCoverImage || createCoverSvgDataUrl({
    title: "Shadows of Destiny",
    author: "Jane Doe",
    style: "Bold Typography",
    bgHex: "#445237",
    textHex: "#ffffff",
    accentHex: "#f7ba04",
  });

  function toggleCheckItem(id) {
    setChecklistItems((items) =>
      items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }

  function handleAddCustomTask() {
    if (!designerNotes.trim()) return;
    setChecklistItems([
      ...checklistItems,
      {
        id: Date.now(),
        text: designerNotes.trim(),
        category: "Custom Instruction",
        checked: false,
      },
    ]);
    setDesignerNotes("");
  }

  function copyChecklistToClipboard() {
    const textToCopy = checklistItems
      .map((item, idx) => `${idx + 1}. [${item.checked ? "DONE" : "TODO"}] (${item.category}): ${item.text}`)
      .join("\n");
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2500);
  }

  function handleTriggerPDFPrint() {
    window.print();
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <span className="page-badge">📄 Freelance Designer Handoff</span>
        <h1 className="page-title">Designer Brief & PDF Export Studio</h1>
        <p className="page-subtitle">
          Export executive PDF diagnostic reports for your publisher or generate copy-pasteable instructions formatted specifically for cover designers on Fiverr, Upwork, or 99designs.
        </p>
      </div>

      <div className="spring-card" style={{ marginBottom: "1.8rem", background: "var(--theme-olive-light)", borderColor: "var(--theme-olive-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", color: "var(--theme-olive-dark)", margin: "0 0 0.2rem 0", fontFamily: "var(--font-serif)" }}>
              Ready to Export Executive Report & Designer Brief
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)" }}>
              Includes title sizing math, WCAG contrast audit, color harmony scores, and actionable fix tasks.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-olive" onClick={handleTriggerPDFPrint}>
              🖨️ 1-Click PDF Report Generator
            </button>
            <button className="btn-russet" onClick={copyChecklistToClipboard}>
              {copiedChecklist ? "✓ Copied to Clipboard!" : "📋 Copy Fix Checklist"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8rem" }}>
        {/* Designer Fix Checklist */}
        <div className="spring-card" style={{ background: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)" }}>
              🛠️ Copy-Pasteable Designer Fix Checklist
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)" }}>
              {checklistItems.filter((i) => i.checked).length}/{checklistItems.length} Resolved
            </span>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)", marginBottom: "1.2rem" }}>
            Send this exact list to your cover designer to fix legibility and contrast issues:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {checklistItems.map((item, idx) => (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.8rem 0", borderBottom: "1px solid var(--theme-cream)" }}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleCheckItem(item.id)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--theme-olive)", cursor: "pointer", marginTop: "2px" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.92rem", color: item.checked ? "var(--theme-muted)" : "var(--theme-ink)", textDecoration: item.checked ? "line-through" : "none" }}>
                    <strong>{idx + 1}.</strong> {item.text}
                  </div>
                </div>
                <span className="page-badge" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>{item.category}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px dashed var(--theme-border)", display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Add custom note for your designer..."
              value={designerNotes}
              onChange={(e) => setDesignerNotes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomTask()}
              className="styled-input"
              style={{ flex: 1 }}
            />
            <button className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.82rem" }} onClick={handleAddCustomTask}>
              + Add Task
            </button>
          </div>
        </div>

        {/* PDF Preview Card */}
        <div className="spring-card" style={{ background: "white" }}>
          <div style={{ borderBottom: "2px solid var(--theme-olive)", paddingBottom: "0.75rem", marginBottom: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--theme-olive)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                EXECUTIVE COVER AUDIT REPORT
              </span>
              <h2 style={{ fontSize: "1.4rem", color: "var(--theme-olive-dark)", margin: 0, fontFamily: "var(--font-serif)" }}>
                Shadows of Destiny
              </h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--theme-muted)" }}>
              Cover Doctor Audit<br />
              {new Date().toLocaleDateString()}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.2rem", marginBottom: "1.4rem" }}>
            <div className="book-cover-3d" style={{ width: "120px" }}>
              <div className="book-cover-3d-inner">
                <img src={coverImgSrc} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div className="card-metrics-row">
                <div>
                  <div className="metric-item-val">84/100</div>
                  <div className="metric-item-lbl">Overall</div>
                </div>
                <div>
                  <div className="metric-item-val">78th</div>
                  <div className="metric-item-lbl">Percentile</div>
                </div>
                <div>
                  <div className="metric-item-val">PASS</div>
                  <div className="metric-item-lbl">WCAG AA</div>
                </div>
              </div>

              <div style={{ fontSize: "0.82rem", color: "var(--theme-ink-light)", marginTop: "0.4rem" }}>
                <strong>Key Benchmark Summary:</strong> Title size occupies 18.4% of total canvas area. Contrast ratio achieves 6.4:1 over primary background dark tones.
              </div>
            </div>
          </div>

          <div style={{ background: "var(--theme-cream)", padding: "1rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--theme-ink)" }}>
            <strong>Designer Delivery Note:</strong> Please complete checked improvement items before final export of high-resolution print files (300 DPI CMYK) and ebook cover JPG.
          </div>
        </div>
      </div>
    </div>
  );
}
