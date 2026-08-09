import React, { useState, useRef, useEffect } from "react";

export default function AvatarDropdown({ onLogout, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="avatar-button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--theme-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>CD</div>
      </button>

      {open && (
        <div className="avatar-dropdown">
          <button className="avatar-dropdown-item" onClick={() => { onNavigate && onNavigate('account'); setOpen(false); }}>👤 Account</button>
          <button className="avatar-dropdown-item" onClick={() => { onNavigate && onNavigate('home'); setOpen(false); }}>🏠 Home</button>
          <div className="avatar-dropdown-divider" />
          <button className="avatar-dropdown-item" onClick={() => { onLogout && onLogout(); setOpen(false); }} style={{ color: "var(--ct-danger)" }}>Sign Out ⇢</button>
        </div>
      )}
    </div>
  );
}
