import PillButton from "../components/PillButton";
import { startCheckout } from "../api/client";
import { useState } from "react";

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function checkout(plan) {
    setLoading(true);
    setMsg("");
    try {
      const res = await startCheckout(plan);
      if (res && res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
      setMsg("Checkout unavailable — please try again later.");
    } catch (err) {
      setMsg(err.message || "Checkout error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.6rem" }}>Pricing</h1>
        <div style={{ color: "var(--theme-text-muted)" }}>Choose a plan that fits your needs</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        <div className="spring-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>Free</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.4rem 0" }}>Free</div>
          <p style={{ color: "var(--theme-text-muted)", marginBottom: "1rem" }}>Basic diagnostics and top-3 recommendations.</p>
          <PillButton variant="muted">Current</PillButton>
        </div>

        <div className="spring-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>Pro</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.4rem 0" }}>From $9 / month</div>
          <p style={{ color: "var(--theme-text-muted)", marginBottom: "1rem" }}>Full percentile metrics, visual breakdowns, and evolution tracking.</p>
          <PillButton onClick={() => checkout("monthly")} disabled={loading}>{loading ? "Starting…" : "Subscribe Monthly"}</PillButton>
        </div>

        <div className="spring-card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>Annual</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.4rem 0" }}>From $90 / year</div>
          <p style={{ color: "var(--theme-text-muted)", marginBottom: "1rem" }}>Best value for active creators.</p>
          <PillButton onClick={() => checkout("annual")} disabled={loading}>{loading ? "Starting…" : "Subscribe Annual"}</PillButton>
        </div>
      </div>

      {msg && <div style={{ marginTop: "1rem", color: "#B91C1C" }}>{msg}</div>}
    </div>
  );
}
