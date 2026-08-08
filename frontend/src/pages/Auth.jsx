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
      localStorage.setItem("token", data.token);
      onAuthenticated();
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="auth-page">
      <h1>Cover Doctor</h1>
      <p>{mode === "login" ? "Log in to your account" : "Create a free account"}</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
        {mutation.isError && <p className="error">{mutation.error.message}</p>}
      </form>

      <button
        className="link-button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
