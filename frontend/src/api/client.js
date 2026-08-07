const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function uploadCover(file) {
  const formData = new FormData();
  formData.append("cover", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed");
  }

  return response.json(); // { cover_id }
}

export async function getReport(coverId) {
  const response = await fetch(`${API_BASE_URL}/report/${coverId}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Failed to fetch report");
  }

  return response.json();
}
