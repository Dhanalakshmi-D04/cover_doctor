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
    <form onSubmit={handleSubmit} className="book-project-form">
      <label htmlFor="project-title">New book project (for tracking versions over time)</label>
      <input
        id="project-title"
        type="text"
        placeholder="e.g. Abandoned Kingdom"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button type="submit" disabled={!title || mutation.isPending}>
        Create project
      </button>
      {mutation.isSuccess && (
        <p className="hint">
          Project ID: <code>{mutation.data.id}</code> — paste this into the upload form below to
          track versions.
        </p>
      )}
      {mutation.isError && <p className="error">{mutation.error.message}</p>}
    </form>
  );
}
