import React from "react";
import TopNav from "./TopNav";

export default function AppShell({ children, activeTab, setActiveTab, isAuthenticated, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="app-container" style={{ paddingTop: "1.5rem", paddingBottom: "3rem", flex: 1 }}>
        {children}
      </main>
      <footer className="no-print app-footer" style={{ textAlign: "center", padding: "1.5rem", borderTop: "1px solid var(--theme-border)", color: "var(--theme-muted)", fontSize: "0.82rem", marginTop: "auto" }}>
        Cover Doctor • Spring Edition • Minimal & Warm Benchmark Analytics for Authors & Designers
      </footer>
    </div>
  );
}
