import React from "react";
import UploadForm from "../components/UploadForm";
import CreateBookProjectForm from "../components/CreateBookProjectForm";
import PillButton from "../components/PillButton";

export default function Home({ onUploaded, onNavigate }) {
  return (
    <div className="home-page animate-fade-in">
      {/* Hero Banner */}
      <div className="page-header" style={{ textAlign: "center", alignItems: "center", marginBottom: "2.8rem" }}>
        <span className="pastel-badge pastel-badge-butter" style={{ padding: "0.45rem 1.2rem", fontSize: "0.88rem" }}>
          ✨ AI-Powered Book Cover Diagnostics & Market Benchmarks
        </span>
        <h1 className="page-title" style={{ fontSize: "2.8rem", maxWidth: "800px", margin: "0.5rem 0", color: "var(--theme-primary)" }}>
          Will your book cover stand out and sell on Amazon?
        </h1>
        <p className="page-subtitle" style={{ fontSize: "1.12rem", textAlign: "center" }}>
          Upload your cover artwork for instant mathematical scoring on title legibility, contrast ratio, and bestseller benchmarks.
        </p>
      </div>

      {/* Upload Card */}
      <div style={{ maxWidth: "680px", margin: "0 auto 3rem auto" }} className="spring-card pastel-card-butter">
        <CreateBookProjectForm />
        <UploadForm onUploaded={onUploaded} />
      </div>

      {/* Feature Navigation Cards Grid with 3D Motion */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.5rem" }}>
        {/* Bestseller Explorer */}
        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigate("explore")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "2.2rem" }}>📚</div>
            <span className="pastel-badge pastel-badge-olive">Bestseller Data</span>
          </div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-primary)", margin: "0.4rem 0", fontFamily: "var(--font-serif)" }}>
            Bestseller Explorer
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-text-muted)", lineHeight: "1.4" }}>
            Browse top Amazon bestseller covers & underlying title/contrast ratios across 5 genres.
          </p>
          <import-placeholder />
          <PillButton onClick={() => onNavigate("explore")} style={{ marginTop: "1rem", width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}>
            Explore Bestsellers →
          </PillButton>
        </div>

        {/* A/B Voting Studio */}
        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigate("ab-test")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "2.2rem" }}>⚔️</div>
            <span className="pastel-badge pastel-badge-chocolate">Reader Voting</span>
          </div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-text)", margin: "0.4rem 0", fontFamily: "var(--font-serif)" }}>
            A/B Voting Studio
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-text-muted)", lineHeight: "1.4" }}>
            Upload Cover A & Cover B for mathematical compare & shareable reader voting links.
          </p>
          <PillButton variant="muted" onClick={() => onNavigate("ab-test")} style={{ marginTop: "1rem", width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}>
            Run Cover A/B Poll →
          </PillButton>
        </div>

        {/* Color & Font Studio */}
        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigate("palette-studio")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "2.2rem" }}>🎨</div>
            <span className="pastel-badge pastel-badge-butter">HSL & Contrast</span>
          </div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-primary)", margin: "0.4rem 0", fontFamily: "var(--font-serif)" }}>
            Color & Font Studio
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-text-muted)", lineHeight: "1.4" }}>
            Extract HSL color palettes, test genre color harmony, and view font legibility heatmaps.
          </p>
          <PillButton onClick={() => onNavigate("palette-studio")} style={{ marginTop: "1rem", width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}>
            Inspect Legibility →
          </PillButton>
        </div>

        {/* PDF Brief Export */}
        <div
          className="spring-card bestseller-card"
          style={{ cursor: "pointer" }}
          onClick={() => onNavigate("export")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "2.2rem" }}>📄</div>
            <span className="pastel-badge pastel-badge-lavender">Designer Handoff</span>
          </div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--theme-text)", margin: "0.4rem 0", fontFamily: "var(--font-serif)" }}>
            PDF Brief Export
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--theme-text-muted)", lineHeight: "1.4" }}>
            Download executive PDF reports & copy designer checklists for freelance cover designers.
          </p>
          <PillButton variant="muted" onClick={() => onNavigate("export")} style={{ marginTop: "1rem", width: "100%", padding: "0.6rem", fontSize: "0.85rem" }}>
            Export PDF Brief →
          </PillButton>
        </div>
      </div>
    </div>
  );
}
