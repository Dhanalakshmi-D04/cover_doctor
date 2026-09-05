import React, { useState, useEffect } from "react";
import { listCovers, createABTest, listABTests, imageUrl } from "../api/client";

export default function ABTestStudio() {
  const [covers, setCovers] = useState([]);
  const [tests, setTests] = useState([]);
  
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("create"); // "create" | "manage"

  useEffect(() => {
    Promise.all([listCovers(), listABTests()])
      .then(([covRes, testRes]) => {
        setCovers(covRes.covers || []);
        setTests(testRes.tests || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCreateTest = async () => {
    if (!selectedA || !selectedB || selectedA === selectedB) {
      alert("Please select two different covers.");
      return;
    }
    try {
      const newTest = await createABTest(selectedA, selectedB);
      setTests([newTest, ...tests]);
      setActiveTab("manage");
      setSelectedA("");
      setSelectedB("");
    } catch (err) {
      alert("Failed to create A/B test.");
    }
  };

  const copyLink = (slug) => {
    const url = `${window.location.origin}/vote/${slug}`;
    navigator.clipboard.writeText(url);
    alert("Public voting link copied to clipboard: " + url);
  };

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Loading A/B Testing Studio...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <span className="page-badge">⚖️ Split Testing</span>
        <h1 className="page-title">A/B Test Studio</h1>
        <p className="page-subtitle">
          Test two different covers against each other. Generate a public link to share on social media or with your mailing list to get real reader votes.
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem" }}>
        <button 
          onClick={() => setActiveTab("create")}
          style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", border: "none", background: activeTab === "create" ? "var(--theme-olive)" : "transparent", color: activeTab === "create" ? "white" : "var(--theme-ink)", cursor: "pointer", fontWeight: 600 }}
        >
          Create New Poll
        </button>
        <button 
          onClick={() => setActiveTab("manage")}
          style={{ padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)", border: "none", background: activeTab === "manage" ? "var(--theme-olive)" : "transparent", color: activeTab === "manage" ? "white" : "var(--theme-ink)", cursor: "pointer", fontWeight: 600 }}
        >
          Manage Active Polls
        </button>
      </div>

      {activeTab === "create" && (
        <div className="spring-card" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
          <h3 style={{ marginBottom: "1.5rem", color: "var(--theme-olive-dark)", fontFamily: "var(--font-serif)" }}>Select Covers for Head-to-Head Testing</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Option A</label>
              <select className="styled-input" value={selectedA} onChange={(e) => setSelectedA(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-glass)" }}>
                <option value="">-- Select Cover A --</option>
                {covers.map(c => (
                  <option key={c.id} value={c.id}>{c.title_text || "Untitled"} (Score: {Math.round(c.overall_score)})</option>
                ))}
              </select>
              {selectedA && (
                <img src={imageUrl(selectedA, covers.find(c => c.id === selectedA)?.filename)} alt="Cover A" style={{ width: "100%", marginTop: "1rem", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }} />
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Option B</label>
              <select className="styled-input" value={selectedB} onChange={(e) => setSelectedB(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-glass)" }}>
                <option value="">-- Select Cover B --</option>
                {covers.map(c => (
                  <option key={c.id} value={c.id}>{c.title_text || "Untitled"} (Score: {Math.round(c.overall_score)})</option>
                ))}
              </select>
              {selectedB && (
                <img src={imageUrl(selectedB, covers.find(c => c.id === selectedB)?.filename)} alt="Cover B" style={{ width: "100%", marginTop: "1rem", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)" }} />
              )}
            </div>
          </div>

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button className="btn-olive" style={{ padding: "0.75rem 2rem", fontSize: "1.1rem" }} onClick={handleCreateTest} disabled={!selectedA || !selectedB}>
              Generate Public Voting Link
            </button>
          </div>
        </div>
      )}

      {activeTab === "manage" && (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {tests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--theme-text-muted)" }}>You haven't created any A/B tests yet.</div>
          ) : (
            tests.map(t => {
              const total = t.votes_a + t.votes_b;
              const pctA = total === 0 ? 0 : Math.round((t.votes_a / total) * 100);
              const pctB = total === 0 ? 0 : Math.round((t.votes_b / total) * 100);
              
              return (
                <div key={t.id} className="spring-card" style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--theme-muted)", marginBottom: "0.25rem" }}>Created {new Date(t.created_at).toLocaleDateString()}</div>
                    <h3 style={{ margin: "0 0 1rem 0", color: "var(--theme-ink)" }}>Poll: {t.slug}</h3>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                      <div style={{ width: "80px", fontWeight: 600 }}>Option A:</div>
                      <div style={{ flex: 1, background: "var(--bg-glass-card)", height: "24px", borderRadius: "12px", overflow: "hidden" }}>
                        <div style={{ width: `${pctA}%`, background: "var(--theme-olive)", height: "100%", transition: "width 0.5s ease" }}></div>
                      </div>
                      <div style={{ width: "80px", textAlign: "right" }}>{t.votes_a} votes</div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "80px", fontWeight: 600 }}>Option B:</div>
                      <div style={{ flex: 1, background: "var(--bg-glass-card)", height: "24px", borderRadius: "12px", overflow: "hidden" }}>
                        <div style={{ width: `${pctB}%`, background: "var(--theme-russet)", height: "100%", transition: "width 0.5s ease" }}></div>
                      </div>
                      <div style={{ width: "80px", textAlign: "right" }}>{t.votes_b} votes</div>
                    </div>
                  </div>
                  
                  <div>
                    <button className="btn-secondary" onClick={() => copyLink(t.slug)}>
                      📋 Copy Link
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
