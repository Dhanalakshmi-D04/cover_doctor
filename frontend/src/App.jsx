import { useState, useEffect } from "react";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Report from "./pages/Report";
import BestsellerExplorer from "./pages/BestsellerExplorer";
import ABTestStudio from "./pages/ABTestStudio";
import ColorPaletteStudio from "./pages/ColorPaletteStudio";
import ExportStudio from "./pages/ExportStudio";
import Navbar from "./components/Navbar";
import { logout } from "./api/client";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [coverId, setCoverId] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (["explore", "ab-test", "palette-studio", "export"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  function handleTabChange(tab) {
    setActiveTab(tab);
    window.location.hash = tab === "home" ? "" : tab;
  }

  async function handleLogout() {
    await logout().catch(() => {});
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCoverId(null);
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Auth onAuthenticated={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      <main className="app-container">
        {coverId ? (
          <Report coverId={coverId} onReset={() => setCoverId(null)} />
        ) : (
          <>
            {activeTab === "home" && (
              <Home onUploaded={setCoverId} onNavigate={handleTabChange} />
            )}
            {activeTab === "explore" && <BestsellerExplorer userCoverId={coverId} />}
            {activeTab === "ab-test" && <ABTestStudio />}
            {activeTab === "palette-studio" && <ColorPaletteStudio />}
            {activeTab === "export" && <ExportStudio />}
          </>
        )}
      </main>

      <footer className="no-print" style={{ textAlign: "center", padding: "1.5rem", borderTop: "1px solid var(--theme-border)", color: "var(--theme-muted)", fontSize: "0.82rem", marginTop: "auto" }}>
        Cover Doctor • Spring Edition • Minimal & Warm Benchmark Analytics for Authors & Designers
      </footer>
    </div>
  );
}

export default App;
