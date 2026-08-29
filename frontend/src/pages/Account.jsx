import { useEffect, useState } from "react";
import { getAccount, openBillingPortal, changePassword, deleteAccount, logoutEverywhere } from "../api/client";
import PillButton from "../components/PillButton";

export default function Account({ onNavigate }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!isDeleting) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsDeleting(false);
        setDeleteConfirm("");
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isDeleting]);

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

  async function handleChangePassword(e) {
    e.preventDefault();
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg({ text: "Password changed successfully.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordMsg({ text: err.message || "Failed to change password.", type: "error" });
    }
  }

  const [logoutMsg, setLogoutMsg] = useState("");

  async function handleLogoutEverywhere() {
    try {
      await logoutEverywhere();
      // Dispatch an event so App.jsx knows to log us out
      window.dispatchEvent(new Event('auth_unauthorized'));
    } catch (err) {
      setLogoutMsg(err.message || "Failed to log out of all devices.");
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") {
      return;
    }
    try {
      await deleteAccount();
      // Dispatch an event so App.jsx knows to log us out and show the login screen
      window.dispatchEvent(new Event('auth_unauthorized'));
    } catch (err) {
      setMsg(err.message || "Failed to delete account.");
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>Account</h1>
      <div className="spring-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--theme-text-muted)" }}>Plan</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, textTransform: "capitalize" }}>{account ? account.plan : "—"}</div>
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

        {msg && <div style={{ marginTop: "1rem", color: "var(--accent-danger)" }}>{msg}</div>}
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Security</h3>
        <div className="spring-card" style={{ padding: "1.5rem" }}>
          <form onSubmit={handleChangePassword} style={{ maxWidth: "400px" }}>
            <h4 style={{ marginBottom: "1rem" }}>Change Password</h4>
            
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-glass)", backgroundColor: "var(--bg-app)" }}
            />
            
            <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-glass)", backgroundColor: "var(--bg-app)" }}
            />
            
            <PillButton type="submit" disabled={!currentPassword || !newPassword}>Update Password</PillButton>
            
            {passwordMsg.text && (
              <div style={{ marginTop: "1rem", color: passwordMsg.type === "error" ? "var(--accent-danger)" : "var(--accent-success)" }}>
                {passwordMsg.text}
              </div>
            )}
          </form>
          
          <hr style={{ border: "0", borderTop: "1px solid var(--border-glass)", margin: "2rem 0" }} />
          
          <div>
            <h4 style={{ marginBottom: "0.5rem" }}>Active Sessions</h4>
            <p style={{ color: "var(--theme-text-muted)", marginBottom: "1rem", fontSize: "0.9rem", maxWidth: "600px" }}>
              If you left your account logged in on a public computer, or simply want to invalidate all existing sessions, you can log out of all other devices.
            </p>
            <button 
              onClick={handleLogoutEverywhere}
              style={{ padding: "0.5rem 1rem", backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-glass)", borderRadius: "var(--radius-md)", cursor: "pointer" }}
            >
              Log out of all devices
            </button>
            {logoutMsg && <div style={{ marginTop: "1rem", color: "var(--accent-danger)" }}>{logoutMsg}</div>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <h3 style={{ marginBottom: "0.5rem", color: "var(--accent-danger)" }}>Danger Zone</h3>
        <div className="spring-card" style={{ padding: "1.5rem", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
          <h4 style={{ marginBottom: "0.5rem" }}>Delete Account</h4>
          <p style={{ color: "var(--theme-text-muted)", marginBottom: "1rem", fontSize: "0.9rem", maxWidth: "600px" }}>
            Permanently delete your account, all uploaded book covers, and all diagnostic reports. This will immediately cancel any active subscription. This action cannot be undone.
          </p>
          
          {!isDeleting ? (
            <button 
              onClick={() => setIsDeleting(true)}
              style={{ padding: "0.5rem 1rem", backgroundColor: "var(--accent-danger)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: "600" }}
            >
              Delete My Account
            </button>
          ) : (
            <div style={{ padding: "1rem", backgroundColor: "rgba(244, 63, 94, 0.1)", borderRadius: "var(--radius-md)", maxWidth: "400px" }}>
              <p style={{ marginBottom: "0.5rem", fontWeight: "600", color: "var(--accent-danger)" }}>Are you absolutely sure?</p>
              <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>Type <strong>DELETE</strong> below to confirm.</p>
              <input
                type="text"
                autoFocus
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--accent-danger)", backgroundColor: "var(--bg-app)", color: "var(--text-primary)" }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "DELETE"}
                  style={{ padding: "0.5rem 1rem", backgroundColor: deleteConfirm === "DELETE" ? "var(--accent-danger)" : "var(--border-glass)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed", fontWeight: "600" }}
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => { setIsDeleting(false); setDeleteConfirm(""); }}
                  style={{ padding: "0.5rem 1rem", backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-glass)", borderRadius: "var(--radius-md)", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
