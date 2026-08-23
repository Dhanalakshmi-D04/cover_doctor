// All requests include credentials: 'include' so the browser automatically
// sends the HttpOnly auth_token cookie on every request. We never read, store,
// or manually attach a token — the cookie is completely managed by the browser.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Base fetch wrapper with credentials always included.
// All API calls go through this so cookie auth is never accidentally omitted.
function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // Always send the HttpOnly cookie
    headers: {
      ...options.headers,
    },
  });
}

async function parseOrThrow(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      // Cookie expired or cleared — notify the app to show the login screen.
      // We deliberately do NOT touch localStorage here since we no longer use it.
      window.dispatchEvent(new Event("auth_unauthorized"));
    }
    const err = new Error(body.message || body.error || "Request failed");
    // Attach the full parsed body so callers can check err.code, err.current_plan, etc.
    err.code = body.error;
    err.body = body;
    throw err;
  }
  return response.json();
}

export async function signup(email, password) {
  const response = await apiFetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseOrThrow(response);
}

export async function login(email, password) {
  const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseOrThrow(response);
}

export async function logout() {
  const response = await apiFetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
  });
  return parseOrThrow(response);
}

// getMe probes the backend to check if the auth cookie is still valid.
// Returns the user's profile on success, throws a 401 error if not authenticated.
// The frontend calls this on app load instead of checking localStorage.
export async function getMe() {
  const response = await apiFetch(`${API_BASE_URL}/user/me`);
  return parseOrThrow(response); // { user_id, email, plan, project_count, project_limit }
}

export async function uploadCover(file, bookProjectId) {
  const formData = new FormData();
  formData.append("cover", file);
  if (bookProjectId) formData.append("book_project_id", bookProjectId);

  const response = await apiFetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  return parseOrThrow(response); // { cover_id }
}

export async function getReport(coverId) {
  const response = await apiFetch(`${API_BASE_URL}/report/${coverId}`);
  return parseOrThrow(response); // { plan, report, locked_sections? }
}

export function imageUrl(coverId, filename) {
  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  return `${API_BASE_URL}/images/${coverId}${ext}`;
}

export async function createBookProject(title) {
  const response = await apiFetch(`${API_BASE_URL}/book-projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return parseOrThrow(response);
}

export async function listBookProjects() {
  const response = await apiFetch(`${API_BASE_URL}/book-projects`);
  return parseOrThrow(response); // { projects: [...] }
}

export async function listVersions(bookProjectId) {
  const response = await apiFetch(`${API_BASE_URL}/book-projects/${bookProjectId}/versions`);
  return parseOrThrow(response); // { locked, versions?, message? }
}

export async function startCheckout(plan) {
  const response = await apiFetch(`${API_BASE_URL}/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  return parseOrThrow(response); // { checkout_url }
}

export async function openBillingPortal() {
  const response = await apiFetch(`${API_BASE_URL}/billing/portal`, {
    method: "POST",
  });
  return parseOrThrow(response); // { portal_url }
}

export async function triggerScraper() {
  const response = await apiFetch(`${API_BASE_URL}/admin/scraper/run`, {
    method: "POST",
  });
  return parseOrThrow(response);
}

export async function getScraperStatus() {
  const response = await apiFetch(`${API_BASE_URL}/admin/scraper/status`);
  return parseOrThrow(response);
}

export async function getAccount() {
  const response = await apiFetch(`${API_BASE_URL}/account`);
  return parseOrThrow(response); // { plan, project_count, project_limit, credits }
}

// getCheckoutURL asks the backend to generate a Polar checkout URL for the given
// plan slug (starter | creator | publisher). The backend injects the user's
// client_reference_id so the webhook knows who paid.
export async function getCheckoutURL(plan) {
  const response = await apiFetch(
    `${API_BASE_URL}/billing/checkout-url?plan=${encodeURIComponent(plan)}`
  );
  return parseOrThrow(response); // { checkout_url }
}

// getUserPlan polls GET /user/plan for up-to-date plan info.
// Used after returning from Polar checkout to detect webhook landing.
export async function getUserPlan() {
  const response = await apiFetch(`${API_BASE_URL}/user/plan`);
  return parseOrThrow(response); // { plan, project_count, project_limit }
}
