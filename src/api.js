export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://pan-backend-production-8d86.up.railway.app").replace(/\/$/, "");

const TOKEN_KEY = "pan_access_token";

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token, remember = true) {
  clearToken();
  if (!token) return;
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

function errorMessage(data, status) {
  return data?.error?.message || data?.error || data?.message || data?.detail || `Request failed (${status})`;
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  const bodyIsForm = options.body instanceof FormData;
  if (options.body && !bodyIsForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (_error) {
    throw new ApiError("Could not reach PAN. Check the backend URL and CORS settings.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = response.status === 204
    ? null
    : contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

  if (!response.ok) {
    if (response.status === 401) clearToken();
    throw new ApiError(errorMessage(data, response.status), response.status, data);
  }
  return data;
}

const json = (value) => JSON.stringify(value);

export const endpoints = {
  health: () => api("/api/health"),
  auth: {
    me: () => api("/api/auth/get-session"),
    login: ({ email, password, remember }) => api("/api/auth/sign-in/email", { method: "POST", body: json({ email, password, rememberMe: remember !== false }) }),
    register: ({ username, email, password }) => api("/api/auth/sign-up/email", { method: "POST", body: json({ name: username, username, email, password, callbackURL: `${window.location.origin}${window.location.pathname}` }) }),
    verify: (payload) => api("/api/auth/verify-email", { method: "POST", body: json(payload) }),
    resend: (payload) => api("/api/auth/resend-verification", { method: "POST", body: json(payload) }),
    forgot: ({ email }) => api("/api/auth/request-password-reset", { method: "POST", body: json({ email, redirectTo: `${window.location.origin}${window.location.pathname}#/reset-password` }) }),
    reset: (payload) => api("/api/auth/reset-password", { method: "POST", body: json(payload) }),
    logout: () => api("/api/auth/sign-out", { method: "POST" }),
    google: () => api("/api/auth/sign-in/social", { method: "POST", body: json({ provider: "google", callbackURL: `${window.location.origin}${window.location.pathname}` }) }),
  },
  account: {
    summary: () => api("/api/account"),
    update: (payload) => api("/api/account", { method: "PATCH", body: json(payload) }),
  },
  projects: {
    list: () => api("/api/projects"),
    get: (id) => api(`/api/projects/${encodeURIComponent(id)}`),
    create: (payload) => api("/api/projects", { method: "POST", body: json(payload) }),
    update: (id, payload) => api(`/api/projects/${encodeURIComponent(id)}`, { method: "PATCH", body: json(payload) }),
    remove: (id) => api(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" }),
    message: (id, payload) => api(`/api/projects/${encodeURIComponent(id)}/messages`, { method: "POST", body: json(payload) }),
    launch: (id, payload) => api(`/api/projects/${encodeURIComponent(id)}/launch`, { method: "POST", body: json(payload) }),
    claimFees: (id) => api(`/api/projects/${encodeURIComponent(id)}/creator-fees/claim`, { method: "POST" }),
  },
  images: {
    generate: (payload) => api("/api/image-generations", { method: "POST", body: json(payload) }),
  },
  credits: {
    summary: () => api("/api/credits"),
    purchase: (payload) => api("/api/credit-purchase-intents", { method: "POST", body: json(payload) }),
    history: () => api("/api/credits/transactions"),
  },
  wallets: {
    list: () => api("/api/wallets"),
    provision: () => api("/api/wallets/provision", { method: "POST" }),
    withdraw: (payload) => api("/api/wallets/withdrawals", { method: "POST", body: json(payload) }),
    connectChallenge: (payload) => api("/api/wallet-connections/challenge", { method: "POST", body: json(payload) }),
    connectVerify: (payload) => api("/api/wallet-connections/verify", { method: "POST", body: json(payload) }),
  },
  sites: {
    list: () => api("/api/sites"),
    create: (payload) => api("/api/sites", { method: "POST", body: json(payload) }),
    get: (id) => api(`/api/sites/${encodeURIComponent(id)}`),
    run: (id, payload) => api(`/api/sites/${encodeURIComponent(id)}/runs`, { method: "POST", body: json(payload) }),
    env: (id) => api(`/api/sites/${encodeURIComponent(id)}/environment-variables`),
    setEnv: (id, payload) => api(`/api/sites/${encodeURIComponent(id)}/environment-variables`, { method: "PUT", body: json(payload) }),
    githubStatus: () => api("/api/github/status"),
    githubConnectUrl: `${API_BASE}/api/github/connect`,
    exportGithub: (id, payload) => api(`/api/sites/${encodeURIComponent(id)}/github-exports`, { method: "POST", body: json(payload) }),
    downloadUrl: (id) => `${API_BASE}/api/sites/${encodeURIComponent(id)}/download`,
  },
  support: {
    list: () => api("/api/support/tickets"),
    create: (payload) => api("/api/support/tickets", { method: "POST", body: json(payload) }),
    reply: (id, payload) => api(`/api/support/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", body: json(payload) }),
    close: (id) => api(`/api/support/tickets/${encodeURIComponent(id)}/close`, { method: "POST" }),
  },
  admin: {
    overview: () => api("/api/admin/overview"),
    users: (query = "") => api(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    grant: (userId, amount, reason) => api(`/api/admin/users/${encodeURIComponent(userId)}/credits`, { method: "POST", body: json({ amount, reason }) }),
    tickets: () => api("/api/admin/support/tickets"),
    operations: () => api("/api/admin/operations"),
  },
};

export function unwrapUser(data) {
  const candidate = data?.user || data?.account || data?.profile || data;
  if (!candidate || candidate.authenticated === false) return null;
  return candidate.id || candidate.userId || candidate.email || candidate.username ? candidate : null;
}

export function unwrapToken(data) {
  return data?.token || data?.accessToken || data?.access_token || data?.jwt || "";
}
