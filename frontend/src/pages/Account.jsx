import { useEffect, useState } from "react";
import { getAccount, openBillingPortal } from "../api/client";
import PillButton from "../components/PillButton";

export default function Account({ onNavigate }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getAccount();
        if (mounted) setAccount(data);
      } catch (err) {
        setMsg("Unable to load account.");
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await openBillingPortal();
      if (res && res.portal_url) {
        window.location.href = res.portal_url;
        return;
      }
      setMsg("Billing portal unavailable. You can subscribe on Pricing.");
    } catch (err) {
      setMsg(err.message || "Billing portal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>Account</h1>
      <div className="spring-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>Plan</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{account ? account.plan : "—"}</div>
          </div>

          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>Projects Used</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
              {account ? `${account.project_count || 0} / ${account.project_limit || 0}` : "—"}
            </div>
          </div>

          <div>
            <PillButton onClick={handleManageBilling} disabled={loading}>
              {loading ? "Opening…" : "Manage Billing"}
            </PillButton>
          </div>
        </div>

        {msg && <div style={{ marginTop: "1rem", color: "#8B0000" }}>{msg}</div>}
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Preferences</h3>
        <div className="spring-card" style={{ padding: "1rem" }}>
          <p style={{ color: "var(--theme-text-muted)" }}>Profile and security settings are managed here.</p>
          <PillButton variant="muted" onClick={() => onNavigate && onNavigate("home")} style={{ marginTop: "0.8rem" }}>Back to Dashboard</PillButton>
        </div>
      </div>
    </div>
  );
}
