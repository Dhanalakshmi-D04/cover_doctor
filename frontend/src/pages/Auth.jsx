import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, signup } from "../api/client";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => (mode === "login" ? login(email, password) : signup(email, password)),
    onSuccess: (data) => {
      if (data && data.token) {
        localStorage.setItem("token", data.token);
      }
      onAuthenticated();
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate();
  }

  // Format raw backend Go validator messages into clean, helpful guidance
  function formatErrorMessage(msg) {
    if (!msg) return "";
    if (msg.includes("Field validation for 'Email'") || msg.includes("email")) {
      return "Please enter a valid email address (e.g. author@domain.com).";
    }
    if (msg.includes("Password") || msg.includes("password")) {
      return "Password must be at least 8 characters long.";
    }
    if (msg.includes("unauthorized") || msg.includes("invalid credentials")) {
      return "Incorrect email or password. Please double check and try again.";
    }
    return msg;
  }

  return (
    <div className="auth-page animate-fade-in" style={{ width: "100%", maxWidth: "440px", margin: "0 auto" }}>
      <div className="spring-card" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
        {/* Brand Header */}
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", background: "var(--theme-primary)", borderRadius: "14px", color: "white", fontWeight: 800, fontSize: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 12px rgba(53,94,59,0.25)" }}>
          CD
        </div>

        <h1 style={{ fontSize: "1.8rem", color: "var(--theme-text)", fontWeight: 800, margin: "0 0 0.2rem 0" }}>
          Cover Doctor
        </h1>
        <p style={{ color: "var(--theme-muted)", fontSize: "0.92rem", marginBottom: "1.8rem" }}>
          {mode === "login" ? "Welcome back! Log in to access your cover diagnostics." : "Create your account to start benchmarking your book covers."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--theme-text)", display: "block", marginBottom: "0.3rem" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. author@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="styled-input"
            />
          </div>

          <div style={{ textAlign: "left" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--theme-text)", display: "block", marginBottom: "0.3rem" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              className="styled-input"
            />
          </div>

          {mutation.isError && (
            <div style={{ background: "var(--theme-secondary-light)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-accent)", color: "var(--theme-brown)", fontSize: "0.85rem", textAlign: "left" }}>
              ⚠️ {formatErrorMessage(mutation.error.message)}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={mutation.isPending}
            style={{ width: "100%", padding: "0.8rem", marginTop: "0.5rem" }}
          >
            {mutation.isPending ? "Connecting..." : mode === "login" ? "Log In to Cover Doctor" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem" }}>
          <button
            className="link-button"
            style={{ margin: "0 auto", fontSize: "0.85rem" }}
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
