import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createBookProject } from "../api/client";

export default function CreateBookProjectForm() {
  const [title, setTitle] = useState("");
  const mutation = useMutation({ mutationFn: () => createBookProject(title) });

  function handleSubmit(event) {
    event.preventDefault();
    if (title) mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px dashed var(--theme-border)" }}>
      <label htmlFor="project-title" style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--theme-olive-dark)", textAlign: "left" }}>
        📚 Start New Book Project (Track cover revisions over time)
      </label>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <input
          id="project-title"
          type="text"
          className="styled-input"
          placeholder="e.g. The Secrets of Aethelgard"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button
          type="submit"
          className="btn-olive"
          disabled={!title || mutation.isPending}
          style={{ whiteSpace: "nowrap", padding: "0.75rem 1.2rem" }}
        >
          {mutation.isPending ? "Creating..." : "Create Project"}
        </button>
      </div>

      {mutation.isSuccess && (
        <div style={{ background: "var(--theme-olive-light)", color: "var(--theme-olive-dark)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-olive-border)", fontSize: "0.85rem", textAlign: "left" }}>
          ✓ Project Created! ID: <strong>{mutation.data.id}</strong> (Auto-attached for version tracking)
        </div>
      )}
      {mutation.isError && (
        <div style={{ color: "var(--theme-russet)", fontSize: "0.85rem", textAlign: "left" }}>
          ⚠️ {mutation.error.message}
        </div>
      )}
    </form>
  );
}
