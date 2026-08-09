import React from "react";
import UpgradeButton from "./UpgradeButton";

export default function Navbar({ activeTab, setActiveTab, isAuthenticated, onLogout }) {
  const navItems = [
    { id: "home", label: "🏠 Score Cover" },
    { id: "explore", label: "📚 Bestseller Explorer" },
    { id: "ab-test", label: "⚔️ A/B Voting Studio" },
    { id: "palette-studio", label: "🎨 Color & Font Studio" },
    { id: "export", label: "📄 PDF & Brief Export" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-logo" onClick={() => setActiveTab("home")}>
          <div className="brand-icon-box">CD</div>
          <div>
            <div className="brand-title">Cover Doctor</div>
          </div>
          <span className="brand-tag">Spring Edition</span>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="nav-right-actions">
          <UpgradeButton />
          {isAuthenticated && (
            <button
              className="btn-secondary"
              onClick={onLogout}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
