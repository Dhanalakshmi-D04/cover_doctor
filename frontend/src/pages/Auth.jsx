import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { login, signup, forgotPassword, resetPassword } from "../api/client";
import PillButton from "../components/PillButton";

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/auth/google`;

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState(null);
  const [resetEmail, setResetEmail] = useState(""); // email from the reset link URL
  const [googleError, setGoogleError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const token = params.get("reset_token");
    
    if (token) {
      setMode("reset");
      setResetToken(token);
      const emailParam = params.get("email");
      if (emailParam) setResetEmail(emailParam);
    }
    
    if (err === "google_cancelled") setGoogleError("Google sign-in was cancelled or failed. Please try again.");
    else if (err === "state_mismatch") setGoogleError("Sign-in session expired. Please try again.");
    else if (err === "email_not_verified") setGoogleError("Your Google account's email is not verified. Please verify it and try again.");
    else if (err) setGoogleError("Google sign-in failed. Please try again or use email/password.");
    
    if (err || token) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("reset_token");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const authMutation = useMutation({
    mutationFn: () => (mode === "login" ? login(email, password) : signup(email, password)),
    onSuccess: () => {
      onAuthenticated();
    },
  });

  const forgotMutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: () => {
      setSuccessMessage("If an account exists for that email, we have printed a password reset link to the server console.");
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetPassword(resetToken, resetEmail, password),
    onSuccess: () => {
      setSuccessMessage("Your password has been reset successfully! You can now log in.");
      setMode("login");
      setPassword("");
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setSuccessMessage("");
    if (mode === "login" || mode === "signup") {
      authMutation.mutate();
    } else if (mode === "forgot") {
      forgotMutation.mutate();
    } else if (mode === "reset") {
      resetMutation.mutate();
    }
  }

  function formatErrorMessage(msg) {
    if (!msg) return "";
    // Only match the specific Go validator binding error for the Email field
    if (msg.includes("Field validation for 'Email'")) {
      return "Please enter a valid email address (e.g. author@domain.com).";
    }
    if (msg.includes("Field validation for 'Password'") || msg.includes("Field validation for 'NewPassword'")) {
      return "Password must be at least 8 characters long.";
    }
    if (msg.includes("unauthorized") || msg.includes("invalid credentials")) {
      return "Incorrect email or password. Please double check and try again.";
    }
    if (msg.includes("Google sign-in")) return msg;
    return msg;
  }

  const activeMutation = mode === "forgot" ? forgotMutation : mode === "reset" ? resetMutation : authMutation;

  return (
    <div className="auth-page animate-fade-in" style={{ width: "100%", maxWidth: "440px", margin: "0 auto" }}>
      <div className="spring-card" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
        
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", background: "var(--theme-primary)", borderRadius: "14px", color: "white", fontWeight: 800, fontSize: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 12px rgba(53,94,59,0.25)" }}>
          CD
        </div>

        <h1 style={{ fontSize: "1.8rem", color: "var(--theme-text)", fontWeight: 800, margin: "0 0 0.2rem 0" }}>
          {mode === "reset" ? "Reset Password" : mode === "forgot" ? "Reset Password" : "Cover Doctor"}
        </h1>
        <p style={{ color: "var(--theme-muted)", fontSize: "0.92rem", marginBottom: "1.8rem" }}>
          {mode === "login" ? "Welcome back! Log in to access your cover diagnostics." :
           mode === "signup" ? "Create your account to start benchmarking your book covers." :
           mode === "reset" ? "Enter your new password below." :
           "Enter your email address to receive a password reset link."}
        </p>

        {(mode === "login" || mode === "signup") && (
          <>
            <a
              href={GOOGLE_AUTH_URL}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                width: "100%", padding: "0.7rem 1rem", marginBottom: "0.5rem",
                border: "1px solid var(--border-glass)", borderRadius: "var(--radius-md)",
                background: "var(--bg-card)", color: "var(--theme-text)",
                fontWeight: 600, fontSize: "0.95rem", textDecoration: "none",
                cursor: "pointer", transition: "opacity 0.15s",
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>

            {googleError && (
              <div style={{ background: "var(--theme-secondary-light)", padding: "0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-accent)", color: "var(--theme-brown)", fontSize: "0.85rem", textAlign: "left", marginBottom: "0.75rem" }}>
                ⚠️ {googleError}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0" }}>
              <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border-glass)" }} />
              <span style={{ color: "var(--theme-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>or continue with email</span>
              <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border-glass)" }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {(mode === "login" || mode === "signup" || mode === "forgot") && (
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
          )}

          {(mode === "login" || mode === "signup" || mode === "reset") && (
            <div style={{ textAlign: "left" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--theme-text)", marginBottom: "0.3rem" }}>
                <span>{mode === "reset" ? "New Password" : "Password"}</span>
                {mode === "login" && (
                  <button type="button" onClick={() => {setMode("forgot"); setSuccessMessage("");}} style={{ background: "none", border: "none", color: "var(--theme-olive)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                    Forgot password?
                  </button>
                )}
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
          )}

          {activeMutation.isError && (
            <div style={{ background: "var(--theme-secondary-light)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-accent)", color: "var(--theme-brown)", fontSize: "0.85rem", textAlign: "left" }}>
              ⚠️ {formatErrorMessage(activeMutation.error.message)}
            </div>
          )}

          {successMessage && (
            <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "var(--accent-success)", fontSize: "0.85rem", textAlign: "left", lineHeight: 1.5 }}>
              ✅ {successMessage}
            </div>
          )}

          <PillButton
            type="submit"
            disabled={activeMutation.isPending}
            style={{ width: "100%", padding: "0.8rem", marginTop: "0.5rem" }}
          >
            {activeMutation.isPending ? "Connecting..." : 
             mode === "login" ? "Log In to Cover Doctor" : 
             mode === "signup" ? "Create Account" : 
             mode === "reset" ? "Set New Password" : 
             "Send Reset Link"}
          </PillButton>
        </form>

        <div style={{ marginTop: "1.5rem" }}>
          {mode === "forgot" || mode === "reset" ? (
            <button className="link-button" style={{ margin: "0 auto", fontSize: "0.85rem" }} onClick={() => {setMode("login"); setSuccessMessage("");}}>
              Return to log in
            </button>
          ) : (
            <button className="link-button" style={{ margin: "0 auto", fontSize: "0.85rem" }} onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
