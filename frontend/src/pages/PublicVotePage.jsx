import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getABTest, voteABTest, imageUrl } from "../api/client";

export default function PublicVotePage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [votedFor, setVotedFor] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getABTest(slug)
      .then((res) => setData(res))
      .catch((err) => setError(true));
  }, [slug]);

  const handleVote = async (choice) => {
    if (votedFor) return;
    try {
      await voteABTest(slug, choice);
      setVotedFor(choice);
      // Optimistically update counts
      setData((prev) => {
        const t = prev.test;
        return {
          ...prev,
          test: {
            ...t,
            votes_a: choice === "A" ? t.votes_a + 1 : t.votes_a,
            votes_b: choice === "B" ? t.votes_b + 1 : t.votes_b,
          },
        };
      });
    } catch (err) {
      alert("Failed to record vote.");
    }
  };

  if (error) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "var(--accent-danger)" }}>Poll not found or inactive.</div>;
  }
  if (!data) {
    return <div style={{ padding: "4rem", textAlign: "center" }}>Loading poll...</div>;
  }

  const { test, cover_a, cover_b } = data;
  const totalVotes = test.votes_a + test.votes_b;
  const pctA = totalVotes === 0 ? 0 : Math.round((test.votes_a / totalVotes) * 100);
  const pctB = totalVotes === 0 ? 0 : Math.round((test.votes_b / totalVotes) * 100);

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", fontFamily: "var(--font-serif)", color: "var(--theme-olive-dark)", marginBottom: "0.5rem" }}>
        Which Cover Do You Prefer?
      </h1>
      <p style={{ textAlign: "center", color: "var(--theme-text-muted)", marginBottom: "2rem" }}>
        An author is split testing these two book covers. Vote for your favorite to see the current results!
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* COVER A */}
        <div 
          onClick={() => handleVote("A")}
          style={{ 
            cursor: votedFor ? "default" : "pointer", 
            border: votedFor === "A" ? "3px solid var(--theme-olive)" : "1px solid var(--border-glass)",
            borderRadius: "var(--radius-md)", 
            padding: "1rem", 
            textAlign: "center",
            opacity: votedFor && votedFor !== "A" ? 0.6 : 1,
            transition: "all 0.2s ease"
          }}>
          <img src={imageUrl(cover_a.id, cover_a.filename)} alt="Cover A" style={{ width: "100%", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)", marginBottom: "1rem" }} />
          {votedFor ? (
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--theme-olive-dark)" }}>{pctA}%</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--theme-text-muted)" }}>{test.votes_a} votes</p>
            </div>
          ) : (
            <button className="btn-olive" style={{ width: "100%" }}>Vote for A</button>
          )}
        </div>

        {/* COVER B */}
        <div 
          onClick={() => handleVote("B")}
          style={{ 
            cursor: votedFor ? "default" : "pointer", 
            border: votedFor === "B" ? "3px solid var(--theme-olive)" : "1px solid var(--border-glass)",
            borderRadius: "var(--radius-md)", 
            padding: "1rem", 
            textAlign: "center",
            opacity: votedFor && votedFor !== "B" ? 0.6 : 1,
            transition: "all 0.2s ease"
          }}>
          <img src={imageUrl(cover_b.id, cover_b.filename)} alt="Cover B" style={{ width: "100%", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-sm)", marginBottom: "1rem" }} />
          {votedFor ? (
            <div>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--theme-olive-dark)" }}>{pctB}%</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--theme-text-muted)" }}>{test.votes_b} votes</p>
            </div>
          ) : (
            <button className="btn-olive" style={{ width: "100%" }}>Vote for B</button>
          )}
        </div>

      </div>
    </div>
  );
}
