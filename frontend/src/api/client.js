const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseOrThrow(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return response.json();
}

export async function signup(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return parseOrThrow(response);
}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return parseOrThrow(response);
}

export async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  return parseOrThrow(response);
}

export async function uploadCover(file, bookProjectId) {
  const formData = new FormData();
  formData.append("cover", file);
  if (bookProjectId) formData.append("book_project_id", bookProjectId);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: formData,
  });
  return parseOrThrow(response); // { cover_id }
}

export async function getReport(coverId) {
  const response = await fetch(`${API_BASE_URL}/report/${coverId}`, {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseOrThrow(response); // { plan, report, locked_sections? }
}

export function imageUrl(coverId, filename) {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  return `${API_BASE_URL}/images/${coverId}${ext}`;
}

export async function createBookProject(title) {
  const response = await fetch(`${API_BASE_URL}/book-projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ title }),
  });
  return parseOrThrow(response);
}

export async function listBookProjects() {
  const response = await fetch(`${API_BASE_URL}/book-projects`, {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseOrThrow(response); // { projects: [...] }
}

export async function listVersions(bookProjectId) {
  const response = await fetch(`${API_BASE_URL}/book-projects/${bookProjectId}/versions`, {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseOrThrow(response); // { locked, versions? , message? }
}

export async function startCheckout(plan) {
  const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ plan }),
  });
  return parseOrThrow(response); // { checkout_url }
}

export async function openBillingPortal() {
  const response = await fetch(`${API_BASE_URL}/billing/portal`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  return parseOrThrow(response); // { portal_url }
}

export async function triggerScraper() {
  const response = await fetch(`${API_BASE_URL}/admin/scraper/run`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
  });
  return parseOrThrow(response);
}

export async function getScraperStatus() {
  const response = await fetch(`${API_BASE_URL}/admin/scraper/status`, {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseOrThrow(response);
}
