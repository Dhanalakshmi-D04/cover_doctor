import { useState, useEffect } from "react";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Report from "./pages/Report";
import BestsellerExplorer from "./pages/BestsellerExplorer";
import ABTestStudio from "./pages/ABTestStudio";
import ColorPaletteStudio from "./pages/ColorPaletteStudio";
import ExportStudio from "./pages/ExportStudio";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import AppShell from "./components/AppShell";
import { logout } from "./api/client";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [coverId, setCoverId] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token === "demo-token" || token === "demo-token-bypass") {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
    }

    function handleUnauthorized() {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setCoverId(null);
    }
    window.addEventListener("auth_unauthorized", handleUnauthorized);

    const hash = window.location.hash.replace("#", "");
    if (["explore", "ab-test", "palette-studio", "export", "account", "pricing"].includes(hash)) {
      setActiveTab(hash);
    }

    return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);

  function handleTabChange(tab) {
    if (tab === "home" && activeTab === "home" && coverId) {
      setCoverId(null);
    }
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
    <AppShell activeTab={activeTab} setActiveTab={handleTabChange} isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      {activeTab === "home" && (
        coverId ? (
          <Report coverId={coverId} onReset={() => setCoverId(null)} onNavigate={handleTabChange} />
        ) : (
          <Home onUploaded={setCoverId} onNavigate={handleTabChange} />
        )
      )}
      {activeTab === "explore" && <BestsellerExplorer userCoverId={coverId} />}
      {activeTab === "ab-test" && <ABTestStudio />}
      {activeTab === "palette-studio" && <ColorPaletteStudio />}
      {activeTab === "export" && <ExportStudio />}
      {activeTab === "account" && <Account onNavigate={handleTabChange} />}
      {activeTab === "pricing" && <Pricing />}
    </AppShell>
  );
}

export default App;
