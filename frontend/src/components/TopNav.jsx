import React from "react";
import CreditsPill from "./CreditsPill";
import AvatarDropdown from "./AvatarDropdown";
import PillButton from "./PillButton";

export default function TopNav({ activeTab, setActiveTab, isAuthenticated, onLogout }) {
  const navItems = [
    { id: "home", label: "🏠 Analyze" },
    { id: "explore", label: "📚 Explorer" },
    { id: "ab-test", label: "⚔️ A/B Studio" },
    { id: "palette-studio", label: "🎨 Palette" },
    { id: "export", label: "📄 Export" },
  ];

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="brand" onClick={() => setActiveTab && setActiveTab("home")}>
          <div className="brand-icon">CD</div>
          <div className="brand-title">Cover Doctor</div>
        </div>

        <nav className="topnav-links">
          {navItems.map((it) => (
            <button key={it.id} className={`topnav-item ${activeTab === it.id ? "active" : ""}`} onClick={() => setActiveTab && setActiveTab(it.id)}>
              {it.label}
            </button>
          ))}
        </nav>

        <div className="topnav-right">
          <CreditsPill />
          <PillButton onClick={() => setActiveTab && setActiveTab("pricing")} style={{ marginLeft: 8 }}>Buy Credits</PillButton>
          <AvatarDropdown onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
