import { useState } from "react";
import Home from "./pages/Home";
import Report from "./pages/Report";
import "./App.css";

function App() {
  const [coverId, setCoverId] = useState(null);

  return (
    <div className="app">
      {coverId ? (
        <Report coverId={coverId} onReset={() => setCoverId(null)} />
      ) : (
        <Home onUploaded={setCoverId} />
      )}
    </div>
  );
}

export default App;
