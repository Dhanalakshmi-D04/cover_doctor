import React from "react";

export default function PillButton({ children, onClick, variant = "gold", className = "", disabled = false, ...props }) {
  const variantClass = variant === "muted" ? "pill-button--muted" : "pill-button--gold";
  return (
    <button
      className={`pill-button ${variantClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
