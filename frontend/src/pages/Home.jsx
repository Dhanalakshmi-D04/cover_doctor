import React from "react";
import UploadForm from "../components/UploadForm";
import CreateBookProjectForm from "../components/CreateBookProjectForm";

export default function Home({ onUploaded, onNavigate }) {
  return (
    <div className="home-page animate-fade-in">
      {/* Hero Banner */}
      <div className="page-header" style={{ textAlign: "center", alignItems: "center", marginBottom: "2.8rem" }}>
        <span className="page-badge" style={{ padding: "0.4rem 1.1rem" }}>
          ✨ AI-Powered Book Cover Diagnostics & Market Benchmarks
        </span>
        <h1 className="page-title" style={{ fontSize: "2.8rem", maxWidth: "800px", margin: "0.4rem 0" }}>
          Will your book cover stand out and sell on Amazon?
        </h1>
        <p className="page-subtitle" style={{ fontSize: "1.12rem", textAlign: "center" }}>
          Upload your cover artwork for instant mathematical scoring on title legibility, contrast ratio, and bestseller benchmarks.
        </p>
      </div>

      {/* Upload Card */}
      <div style={{ maxWidth: "680px", margin: "0 auto 3rem auto" }} className="spring-card">
        <CreateBookProjectForm />
        <UploadForm onUploaded={onUploaded} />
      </div>

      {/* Feature Navigation Cards Grid with 3D Motion */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.5rem" }}>
        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer", background: "white" }}
          onClick={() => onNavigate("explore")}
        >
          <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>📚</div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)", marginBottom: "0.4rem", fontFamily: "var(--font-serif)" }}>
            Bestseller Explorer
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)", lineHeight: "1.4" }}>
            Browse top Amazon bestseller covers & underlying title/contrast ratios across 5 genres.
          </p>
          <button className="btn-olive" style={{ marginTop: "1rem", width: "100%", padding: "0.55rem", fontSize: "0.82rem" }}>
            Explore Bestsellers →
          </button>
        </div>

        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer", background: "white" }}
          onClick={() => onNavigate("ab-test")}
        >
          <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>⚔️</div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)", marginBottom: "0.4rem", fontFamily: "var(--font-serif)" }}>
            A/B Voting Studio
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)", lineHeight: "1.4" }}>
            Upload Cover A & Cover B for mathematical compare & shareable reader voting links.
          </p>
          <button className="btn-russet" style={{ marginTop: "1rem", width: "100%", padding: "0.55rem", fontSize: "0.82rem" }}>
            Run Cover A/B Poll →
          </button>
        </div>

        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer", background: "white" }}
          onClick={() => onNavigate("palette-studio")}
        >
          <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>🎨</div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)", marginBottom: "0.4rem", fontFamily: "var(--font-serif)" }}>
            Color & Font Studio
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)", lineHeight: "1.4" }}>
            Extract HSL color palettes, test genre color harmony, and view font legibility heatmaps.
          </p>
          <button className="btn-amber" style={{ marginTop: "1rem", width: "100%", padding: "0.55rem", fontSize: "0.82rem" }}>
            Inspect Legibility →
          </button>
        </div>

        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer", background: "white" }}
          onClick={() => onNavigate("export")}
        >
          <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>📄</div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)", marginBottom: "0.4rem", fontFamily: "var(--font-serif)" }}>
            PDF Brief Export
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)", lineHeight: "1.4" }}>
            Download executive PDF reports & copy designer checklists for freelance cover designers.
          </p>
          <button className="btn-secondary" style={{ marginTop: "1rem", width: "100%", padding: "0.55rem", fontSize: "0.82rem" }}>
            Export PDF Brief →
          </button>
        </div>
      </div>
    </div>
  );
}
