import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadCover } from "../api/client";

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [bookProjectId, setBookProjectId] = useState("");

  const mutation = useMutation({
    mutationFn: () => uploadCover(file, bookProjectId || undefined),
    onSuccess: (data) => onUploaded(data.cover_id),
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (file) mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <label htmlFor="cover-input">Upload your book cover</label>
      <input
        id="cover-input"
        type="file"
        accept="image/png, image/jpeg"
        onChange={(event) => setFile(event.target.files[0])}
      />

      <label htmlFor="book-project-input">
        Book project ID (optional — attaches this as a new version for Evolution Tracking)
      </label>
      <input
        id="book-project-input"
        type="text"
        placeholder="Leave blank for a one-off upload"
        value={bookProjectId}
        onChange={(event) => setBookProjectId(event.target.value)}
      />

      <button type="submit" disabled={!file || mutation.isPending}>
        {mutation.isPending ? "Scoring..." : "Get my score"}
      </button>
      {mutation.isError && <p className="error">{mutation.error.message}</p>}
    </form>
  );
}
