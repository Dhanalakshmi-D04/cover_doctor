import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listBenchmarks } from "../api/client";

export default function BestsellerExplorer({ _userCoverId, userCoverImage }) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedStyle, setSelectedStyle] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["benchmarks"],
    queryFn: () => listBenchmarks()
  });

  const benchmarks = data?.benchmarks || [];

  // Get unique genres and styles for filters
  const genres = ["All", ...new Set(benchmarks.map(b => b.category).filter(Boolean))];
  const styles = ["All", ...new Set(benchmarks.map(b => b.style).filter(Boolean))];

  // Filter covers by genre, style, and search
  const filteredCovers = benchmarks.filter((cover) => {
    const matchesGenre = selectedGenre === "All" || cover.category === selectedGenre;
    const matchesStyle = selectedStyle === "All" || cover.style === selectedStyle;
    const titleMatch = cover.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = cover.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = searchQuery === "" || titleMatch || authorMatch;
    
    // Only show ones with images
    return matchesGenre && matchesStyle && matchesSearch && cover.image_url;
  });

  if (isLoading) {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Loading Bestsellers from database...</div>;
  }

  if (error) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "var(--accent-danger)" }}>Error loading bestsellers.</div>;
  }

  return (
    <div className="animate-fade-in" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="page-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span className="page-badge">📚 Market Intelligence</span>
        <h1 className="page-title">Bestseller Explorer</h1>
        <p className="page-subtitle">
          Browse real Amazon bestsellers and see how they score on our metrics.
        </p>
      </div>

      <div className="spring-card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--theme-muted)" }}>Genre</label>
          <select className="styled-input" value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} style={{ padding: "0.5rem 1rem", minWidth: "150px" }}>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--theme-muted)" }}>Visual Style</label>
          <select className="styled-input" value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} style={{ padding: "0.5rem 1rem", minWidth: "150px" }}>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--theme-muted)" }}>Search</label>
          <input 
            type="text" 
            className="styled-input" 
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 1rem" }}
          />
        </div>
      </div>

      {filteredCovers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--theme-text-muted)" }}>
          {benchmarks.length === 0 ? "The backend database has no benchmarks yet. Run the scraper!" : "No covers match your filters."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "2rem" }}>
          {filteredCovers.map(cover => (
            <div key={cover.id} className="spring-card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ aspectRatio: "2/3", borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <img src={cover.image_url} alt={cover.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1rem", color: "var(--theme-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cover.title}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--theme-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cover.author}
                </p>
                <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  <span className="page-badge" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>{cover.style}</span>
                  <span className="page-badge" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "var(--theme-olive-light)", color: "var(--theme-olive-dark)", borderColor: "var(--theme-olive-border)" }}>
                    Title: {cover.title_height_percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
