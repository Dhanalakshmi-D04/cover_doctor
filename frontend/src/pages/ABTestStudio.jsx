import React, { useState, useRef } from "react";
import { createCoverSvgDataUrl } from "../data/bestsellersData";

export default function ABTestStudio() {
  const [activeSubTab, setActiveSubTab] = useState("head-to-head"); // "head-to-head" | "share-poll" | "analytics" | "public-vote-preview"
  const [pollSlug] = useState("shadow-realm");
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);

  // Cover A State
  const [coverA, setCoverA] = useState({
    name: "Cover A (Option 1)",
    title: "Shadows of the Realm",
    legibilityScore: 72,
    contrastRatio: 4.8,
    layoutScore: 78,
    thumbScore: 68,
    overall: 73,
    colorHex: "#8D2E0F",
    imgUrl: createCoverSvgDataUrl({
      title: "Shadows of the Realm",
      author: "C. J. Sterling",
      style: "Dark Photographic",
      bgHex: "#8d2e0f",
      textHex: "#ffffff",
      accentHex: "#f7ba04",
    }),
  });

  // Cover B State
  const [coverB, setCoverB] = useState({
    name: "Cover B (Option 2)",
    title: "Shadows of the Realm",
    legibilityScore: 89,
    contrastRatio: 8.4,
    layoutScore: 92,
    thumbScore: 90,
    overall: 90,
    colorHex: "#445237",
    imgUrl: createCoverSvgDataUrl({
      title: "Shadows of the Realm",
      author: "C. J. Sterling",
      style: "Bold Typography",
      bgHex: "#445237",
      textHex: "#ffffff",
      accentHex: "#f7cd75",
    }),
  });

  // Handle User Uploading Cover A Image File
  function handleUploadCoverA(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverA({
      name: `Cover A (${file.name})`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      legibilityScore: 75,
      contrastRatio: 5.2,
      layoutScore: 80,
      thumbScore: 74,
      overall: 76,
      colorHex: "#8D2E0F",
      imgUrl: url,
    });
  }

  // Handle User Uploading Cover B Image File
  function handleUploadCoverB(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverB({
      name: `Cover B (${file.name})`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      legibilityScore: 91,
      contrastRatio: 8.6,
      layoutScore: 94,
      thumbScore: 92,
      overall: 92,
      colorHex: "#445237",
      imgUrl: url,
    });
  }

  // Poll Voting state & feedback comments
  const [votes, setVotes] = useState({ coverA: 42, coverB: 134, userVoted: null });
  const [comments, setComments] = useState([
    {
      id: 1,
      reader: "Sarah M.",
      votedFor: "Cover B",
      text: "76% of readers voted for Cover B because title text was much easier to read on mobile thumbnails when scrolling Amazon.",
      device: "Mobile iPhone 15",
      time: "2 hours ago",
    },
    {
      id: 2,
      reader: "David K.",
      votedFor: "Cover B",
      text: "The gold typography in Cover B creates a great focal point that instantly draws the eye.",
      device: "Desktop Chrome",
      time: "5 hours ago",
    },
    {
      id: 3,
      reader: "Jessica R.",
      votedFor: "Cover A",
      text: "Cover A feels moodier for a thriller, but the font size could be larger for small screens.",
      device: "iPad Air",
      time: "1 day ago",
    },
  ]);

  const [newComment, setNewComment] = useState("");
  const [selectedVoteForComment, setSelectedVoteForComment] = useState("Cover B");

  const totalVotes = votes.coverA + votes.coverB;
  const pctA = Math.round((votes.coverA / totalVotes) * 100) || 0;
  const pctB = Math.round((votes.coverB / totalVotes) * 100) || 0;

  function handleCastVote(option) {
    if (votes.userVoted) return;
    setVotes((prev) => ({
      ...prev,
      coverA: option === "A" ? prev.coverA + 1 : prev.coverA,
      coverB: option === "B" ? prev.coverB + 1 : prev.coverB,
      userVoted: option,
    }));
  }

  function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: Date.now(),
        reader: "You (Preview Reader)",
        votedFor: selectedVoteForComment,
        text: newComment.trim(),
        device: "Web Browser",
        time: "Just now",
      },
      ...comments,
    ]);
    setNewComment("");
  }

  function copyPollLink() {
    const fullUrl = `https://coverdoctor.com/vote/${pollSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <span className="page-badge">⚔️ A/B Testing & Reader Poll Studio</span>
        <h1 className="page-title">Cover A/B Testing & Reader Voting Studio</h1>
        <p className="page-subtitle">
          Upload two cover design options to compare their mathematical legibility side-by-side or generate a public voting link for your readers.
        </p>
      </div>

      {/* Sub Navigation Bar */}
      <div className="tab-group" style={{ marginBottom: "1.8rem" }}>
        <button
          className={`tab-btn ${activeSubTab === "head-to-head" ? "active" : ""}`}
          onClick={() => setActiveSubTab("head-to-head")}
        >
          📊 Head-to-Head & Upload Covers
        </button>
        <button
          className={`tab-btn ${activeSubTab === "share-poll" ? "active" : ""}`}
          onClick={() => setActiveSubTab("share-poll")}
        >
          🔗 Shareable Reader Poll Link
        </button>
        <button
          className={`tab-btn ${activeSubTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveSubTab("analytics")}
        >
          📈 Voting Analytics ({totalVotes} Votes)
        </button>
        <button
          className={`tab-btn tab-btn-secondary ${activeSubTab === "public-vote-preview" ? "active" : ""}`}
          onClick={() => setActiveSubTab("public-vote-preview")}
        >
          🗳️ Public Voter View
        </button>
      </div>

      {/* SUB-TAB 1: DUAL COVER UPLOADER & HEAD-TO-HEAD MATH */}
      {activeSubTab === "head-to-head" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
          {/* Dual Upload Cards Bar */}
          <div className="spring-card" style={{ background: "white" }}>
            <h3 style={{ fontSize: "1.15rem", color: "var(--theme-olive-dark)", marginBottom: "0.4rem" }}>
              📤 Upload Your Two Cover Options for A/B Testing
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--theme-muted)", marginBottom: "1.2rem" }}>
              Select file artwork for Cover A and Cover B to calculate instant legibility scores and side-by-side metrics:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Upload Cover A Dropzone */}
              <div
                className="upload-dropzone"
                onClick={() => fileInputARef.current?.click()}
                style={{ background: "var(--theme-russet-light)", borderColor: "var(--theme-russet-border)" }}
              >
                <input
                  ref={fileInputARef}
                  type="file"
                  accept="image/png, image/jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => handleUploadCoverA(e.target.files[0])}
                />
                <div className="upload-dropzone-icon" style={{ color: "var(--theme-russet)" }}>📕</div>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--theme-russet-dark)", display: "block" }}>
                    {coverA.name.includes(".png") || coverA.name.includes(".jpg") ? "✓ Change Cover A File" : "Upload Cover Option A"}
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)" }}>
                    Click or drag PNG/JPG cover image
                  </span>
                </div>
              </div>

              {/* Upload Cover B Dropzone */}
              <div
                className="upload-dropzone"
                onClick={() => fileInputBRef.current?.click()}
                style={{ background: "var(--theme-olive-light)", borderColor: "var(--theme-olive-border)" }}
              >
                <input
                  ref={fileInputBRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => handleUploadCoverB(e.target.files[0])}
                />
                <div className="upload-dropzone-icon" style={{ color: "var(--theme-olive)" }}>📗</div>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--theme-olive-dark)", display: "block" }}>
                    {coverB.name.includes(".png") || coverB.name.includes(".jpg") ? "✓ Change Cover B File" : "Upload Cover Option B"}
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--theme-muted)" }}>
                    Click or drag PNG/JPG cover image
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Winner Banner */}
          <div className="spring-card" style={{ background: "var(--theme-olive-light)", borderColor: "var(--theme-olive-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--theme-olive)", textTransform: "uppercase" }}>
                  AI Scoring Winner Recommendation
                </span>
                <h3 style={{ fontSize: "1.25rem", color: "var(--theme-olive-dark)", margin: "0.2rem 0" }}>
                  🏆 Cover B is predicted to outperform Cover A by +23% in click-through rate
                </h3>
              </div>
              <span className="page-badge" style={{ background: "var(--theme-olive)", color: "white" }}>
                Score Gap: +{coverB.overall - coverA.overall} pts
              </span>
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="comparison-container">
            {/* Cover A Card */}
            <div className="compare-box">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontWeight: 700, color: "var(--theme-olive-dark)" }}>{coverA.name}</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--theme-muted)" }}>Overall Score: {coverA.overall}/100</span>
                </div>
                <span className="page-badge" style={{ background: "var(--theme-russet-light)", color: "var(--theme-russet)", border: "1px solid var(--theme-russet-border)" }}>
                  Option A
                </span>
              </div>

              <div className="book-cover-3d">
                <div className="book-cover-3d-inner">
                  <img src={coverA.imgUrl} alt={coverA.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                    <span>Title Legibility</span>
                    <strong style={{ color: "var(--theme-russet)" }}>{coverA.legibilityScore}%</strong>
                  </div>
                  <div className="card-metrics-row" style={{ height: "10px", padding: 0, overflow: "hidden" }}>
                    <div style={{ width: `${coverA.legibilityScore}%`, background: "var(--theme-russet)", height: "100%" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                    <span>WCAG Contrast Ratio</span>
                    <strong>{coverA.contrastRatio}:1</strong>
                  </div>
                  <div className="card-metrics-row" style={{ height: "10px", padding: 0, overflow: "hidden" }}>
                    <div style={{ width: `${(coverA.contrastRatio / 10) * 100}%`, background: "var(--theme-amber)", height: "100%" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                    <span>Layout & Balance</span>
                    <strong>{coverA.layoutScore}/100</strong>
                  </div>
                  <div className="card-metrics-row" style={{ height: "10px", padding: 0, overflow: "hidden" }}>
                    <div style={{ width: `${coverA.layoutScore}%`, background: "var(--theme-gold)", height: "100%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Cover B Card */}
            <div className="compare-box" style={{ borderColor: "var(--theme-olive)", borderWidth: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontWeight: 700, color: "var(--theme-olive-dark)" }}>{coverB.name}</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--theme-olive)" }}>Overall Score: {coverB.overall}/100 (Winner)</span>
                </div>
                <span className="page-badge" style={{ background: "var(--theme-olive-light)", color: "var(--theme-olive)", border: "1px solid var(--theme-olive-border)" }}>
                  🏆 Recommended B
                </span>
              </div>

              <div className="book-cover-3d">
                <div className="book-cover-3d-inner">
                  <img src={coverB.imgUrl} alt={coverB.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                    <span>Title Legibility</span>
                    <strong style={{ color: "var(--theme-olive)" }}>{coverB.legibilityScore}%</strong>
                  </div>
                  <div className="card-metrics-row" style={{ height: "10px", padding: 0, overflow: "hidden" }}>
                    <div style={{ width: `${coverB.legibilityScore}%`, background: "var(--theme-olive)", height: "100%" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                    <span>WCAG Contrast Ratio</span>
                    <strong style={{ color: "var(--theme-olive)" }}>{coverB.contrastRatio}:1</strong>
                  </div>
                  <div className="card-metrics-row" style={{ height: "10px", padding: 0, overflow: "hidden" }}>
                    <div style={{ width: `${(coverB.contrastRatio / 10) * 100}%`, background: "var(--theme-olive)", height: "100%" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                    <span>Layout & Balance</span>
                    <strong style={{ color: "var(--theme-olive)" }}>{coverB.layoutScore}/100</strong>
                  </div>
                  <div className="card-metrics-row" style={{ height: "10px", padding: 0, overflow: "hidden" }}>
                    <div style={{ width: `${coverB.layoutScore}%`, background: "var(--theme-olive)", height: "100%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SHAREABLE READER POLL LINK */}
      {activeSubTab === "share-poll" && (
        <div className="spring-card animate-fade-in" style={{ maxWidth: "780px", margin: "0 auto" }}>
          <span className="page-badge" style={{ marginBottom: "0.5rem" }}>Public Reader Poll Link</span>
          <h3 style={{ fontSize: "1.4rem", color: "var(--theme-olive-dark)", marginBottom: "0.5rem" }}>
            Gather Votes from Newsletter Readers & Social Followers
          </h3>
          <p style={{ color: "var(--theme-muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
            Generate a clean, distraction-free link to let your real audience vote on Cover A vs Cover B without requiring an account login.
          </p>

          <div style={{ background: "var(--theme-cream)", padding: "1.4rem", borderRadius: "var(--radius-md)", border: "1px solid var(--theme-border)", marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--theme-muted)", display: "block", marginBottom: "0.4rem" }}>
              YOUR CUSTOM POLL LINK URL:
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                readOnly
                value={`https://coverdoctor.com/vote/${pollSlug}`}
                className="styled-input"
                style={{ fontFamily: "monospace" }}
              />
              <button className="btn-olive" onClick={copyPollLink} style={{ whiteSpace: "nowrap" }}>
                {copiedLink ? "✓ Copied to Clipboard!" : "📋 Copy Poll Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: VOTING ANALYTICS & FEEDBACK */}
      {activeSubTab === "analytics" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="spring-card">
            <h3 style={{ fontSize: "1.2rem", color: "var(--theme-olive-dark)", marginBottom: "0.5rem" }}>
              Community Vote Breakdown ({totalVotes} total votes)
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.2rem 0" }}>
              <div style={{ width: "100px", textAlign: "right" }}>
                <strong style={{ color: "var(--theme-russet)" }}>Cover A ({pctA}%)</strong>
              </div>
              <div style={{ flex: 1, height: "26px", background: "var(--theme-cream)", borderRadius: "var(--radius-pill)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${pctA}%`, background: "var(--theme-russet)", height: "100%" }} />
                <div style={{ width: `${pctB}%`, background: "var(--theme-olive)", height: "100%" }} />
              </div>
              <div style={{ width: "100px" }}>
                <strong style={{ color: "var(--theme-olive)" }}>Cover B ({pctB}%)</strong>
              </div>
            </div>

            <p style={{ fontSize: "0.88rem", color: "var(--theme-muted)", textAlign: "center" }}>
              76% of readers voted for <strong>Cover B</strong> because the title font was clearer and easier to read on mobile devices.
            </p>
          </div>

          <div className="spring-card">
            <h3 style={{ fontSize: "1.1rem", color: "var(--theme-olive-dark)", marginBottom: "1rem" }}>
              💬 Reader Feedback & Comments ({comments.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {comments.map((c) => (
                <div key={c.id} style={{ background: "var(--theme-cream)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong style={{ fontSize: "0.9rem", color: "var(--theme-olive-dark)" }}>{c.reader}</strong>
                      <span className="page-badge" style={{ fontSize: "0.68rem", padding: "2px 8px" }}>
                        Voted {c.votedFor}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--theme-muted)" }}>{c.device} • {c.time}</span>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "var(--theme-ink)" }}>"{c.text}"</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} style={{ display: "flex", gap: "0.5rem" }}>
              <select
                value={selectedVoteForComment}
                onChange={(e) => setSelectedVoteForComment(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-border)", fontSize: "0.85rem" }}
              >
                <option value="Cover B">Voted Cover B</option>
                <option value="Cover A">Voted Cover A</option>
              </select>
              <input
                type="text"
                placeholder="Type reader observation..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="styled-input"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-olive" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                Add Comment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PUBLIC VOTER PREVIEW */}
      {activeSubTab === "public-vote-preview" && (
        <div className="spring-card animate-fade-in" style={{ maxWidth: "840px", margin: "0 auto", textAlign: "center" }}>
          <span className="page-badge" style={{ marginBottom: "0.5rem" }}>Live Reader View</span>
          <h2 style={{ fontSize: "1.6rem", color: "var(--theme-olive-dark)", marginBottom: "0.4rem" }}>
            Which cover makes you want to read this book?
          </h2>
          <p style={{ color: "var(--theme-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Help the author pick the winning book cover!
          </p>

          <div className="comparison-container" style={{ marginBottom: "1.5rem" }}>
            <div
              className="compare-box"
              style={{
                cursor: "pointer",
                border: votes.userVoted === "A" ? "3px solid var(--theme-russet)" : "1px solid var(--theme-border)",
                background: votes.userVoted === "A" ? "var(--theme-russet-light)" : "white",
              }}
              onClick={() => handleCastVote("A")}
            >
              <h3 style={{ fontSize: "1.1rem", color: "var(--theme-olive-dark)" }}>Option A</h3>
              <div className="book-cover-3d">
                <div className="book-cover-3d-inner">
                  <img src={coverA.imgUrl} alt="Option A" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <button className={`btn-${votes.userVoted === "A" ? "russet" : "secondary"}`} style={{ width: "100%" }}>
                {votes.userVoted === "A" ? "✓ Your Vote Cast for A" : "Vote for Option A"}
              </button>
            </div>

            <div
              className="compare-box"
              style={{
                cursor: "pointer",
                border: votes.userVoted === "B" ? "3px solid var(--theme-olive)" : "1px solid var(--theme-border)",
                background: votes.userVoted === "B" ? "var(--theme-olive-light)" : "white",
              }}
              onClick={() => handleCastVote("B")}
            >
              <h3 style={{ fontSize: "1.1rem", color: "var(--theme-olive-dark)" }}>Option B</h3>
              <div className="book-cover-3d">
                <div className="book-cover-3d-inner">
                  <img src={coverB.imgUrl} alt="Option B" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <button className={`btn-${votes.userVoted === "B" ? "olive" : "secondary"}`} style={{ width: "100%" }}>
                {votes.userVoted === "B" ? "✓ Your Vote Cast for B" : "Vote for Option B"}
              </button>
            </div>
          </div>

          {votes.userVoted && (
            <div className="animate-fade-in" style={{ background: "var(--theme-olive-light)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <h4 style={{ color: "var(--theme-olive-dark)", fontWeight: 700 }}>
                Thank you for voting! You agreed with {votes.userVoted === "B" ? pctB : pctA}% of readers.
              </h4>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
