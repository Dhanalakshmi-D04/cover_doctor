import { useState } from "react";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Report from "./pages/Report";
import UpgradeButton from "./components/UpgradeButton";
import { logout } from "./api/client";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [coverId, setCoverId] = useState(null);

  async function handleLogout() {
    await logout().catch(() => {});
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCoverId(null);
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <Auth onAuthenticated={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <UpgradeButton />
        <button className="link-button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {coverId ? (
        <Report coverId={coverId} onReset={() => setCoverId(null)} />
      ) : (
        <Home onUploaded={setCoverId} />
      )}
    </div>
  );
}

export default App;
