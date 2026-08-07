import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadCover } from "../api/client";

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);

  const mutation = useMutation({
    mutationFn: uploadCover,
    onSuccess: (data) => onUploaded(data.cover_id),
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (file) mutation.mutate(file);
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
      <button type="submit" disabled={!file || mutation.isPending}>
        {mutation.isPending ? "Scoring..." : "Get my score"}
      </button>
      {mutation.isError && <p className="error">{mutation.error.message}</p>}
    </form>
  );
}
