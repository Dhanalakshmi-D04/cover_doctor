import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadCover } from "../api/client";

export default function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [bookProjectId, setBookProjectId] = useState("");
  const fileInputRef = useRef(null);

  const mutation = useMutation({
    mutationFn: () => uploadCover(file, bookProjectId || undefined),
    onSuccess: (data) => onUploaded(data.cover_id),
  });

  function handleFileSelect(selectedFile) {
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (file) mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem", width: "100%" }}>
      {/* File Dropzone */}
      <div
        className="upload-dropzone"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          style={{ display: "none" }}
          onChange={(event) => handleFileSelect(event.target.files[0])}
        />

        {previewUrl ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "120px", aspectRatio: "2/3", borderRadius: "8px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              <img src={previewUrl} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: "0.85rem", color: "var(--theme-olive)", fontWeight: 700 }}>
              ✓ Selected: {file.name} (Click to change)
            </span>
          </div>
        ) : (
          <>
            <div className="upload-dropzone-icon">📖</div>
            <div>
              <strong style={{ fontSize: "1.05rem", color: "var(--theme-olive-dark)", display: "block", marginBottom: "0.2rem" }}>
                Click or Drag Book Cover Artwork Here
              </strong>
              <span style={{ fontSize: "0.82rem", color: "var(--theme-muted)" }}>
                Supports high-resolution PNG & JPEG image formats
              </span>
            </div>
          </>
        )}
      </div>

      {/* Book Project ID optional field */}
      <div style={{ textAlign: "left" }}>
        <label htmlFor="book-project-input" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--theme-olive-dark)", display: "block", marginBottom: "0.35rem" }}>
          Attach to Book Project ID (Optional — for version evolution tracking)
        </label>
        <input
          id="book-project-input"
          type="text"
          className="styled-input"
          placeholder="Leave blank for one-off score, or paste Project ID..."
          value={bookProjectId}
          onChange={(event) => setBookProjectId(event.target.value)}
        />
      </div>

      <button
        type="submit"
        className="btn-amber"
        disabled={!file || mutation.isPending}
        style={{ width: "100%", padding: "0.85rem", fontSize: "1rem", opacity: (!file || mutation.isPending) ? 0.6 : 1 }}
      >
        {mutation.isPending ? "⏳ Analyzing & Scoring Cover..." : "✨ Calculate Book Cover Score"}
      </button>

      {mutation.isError && (
        <div style={{ background: "var(--theme-russet-light)", color: "var(--theme-russet)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--theme-russet-border)", fontSize: "0.85rem" }}>
          ⚠️ {mutation.error.message}
        </div>
      )}
    </form>
  );
}
