export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://pan-backend-production-8d86.up.railway.app").replace(/\/$/, "");

export function mediaUrl(value) {
  if (!value || value.startsWith("data:") || value.startsWith("blob:") || /^https?:\/\//i.test(value)) return value || "";
  return `${API_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

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

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function waitForAiRun(run) {
  const id = run?.id || run?.runId;
  if (!id) throw new ApiError("PAN did not return an AI run id.");
  const startedAt = Date.now();
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const result = await api(`/api/ai/runs/${encodeURIComponent(id)}`);
    const status = result?.run?.status || result?.status;
    if (status === "succeeded") return result;
    if (status === "failed" || status === "cancelled") throw new ApiError(result?.run?.errorMessage || result?.error || `AI run ${status}.`);

    const elapsed = Date.now() - startedAt;
    const delay = elapsed < 3_000 ? 250 : elapsed < 10_000 ? 500 : 1_000;
    await wait(delay);
  }
  throw new ApiError("PAN is still working. Refresh the project shortly to see the result.", 202);
}

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
    stats: (id) => api(`/api/projects/${encodeURIComponent(id)}/stats`),
    launchPreview: (id, payload) => api("/api/launches/preview", { method: "POST", body: json({ projectId: id, walletMode: payload.walletMode === "connected" ? "external" : "managed", devBuyEth: String(payload.devBuyEth || 0) }) }),
    message: async (id, payload) => {
      const created = await api(`/api/projects/${encodeURIComponent(id)}/chat`, { method: "POST", body: json({ prompt: payload.message, performance: payload.performance, attachments: payload.attachments, idempotencyKey: crypto.randomUUID() }) });
      return waitForAiRun(created?.run || created);
    },
    launch: (id, payload) => api(`/api/projects/${encodeURIComponent(id)}/launch`, { method: "POST", body: json({ walletMode: payload.walletMode === "connected" ? "external" : "managed", devBuyEth: String(payload.devBuyEth || 0), feeWalletAddress: payload.feeWalletAddress?.trim() || undefined, idempotencyKey: crypto.randomUUID() }) }),
    claimFees: (id, walletMode = "managed") => api(`/api/projects/${encodeURIComponent(id)}/creator-fees/claim`, { method: "POST", body: json({ walletMode, idempotencyKey: crypto.randomUUID() }) }),
  },
  images: {
    generate: async (payload) => {
      const created = await api(`/api/projects/${encodeURIComponent(payload.projectId)}/images`, { method: "POST", body: json({ prompt: payload.prompt, performance: payload.performance, kind: payload.purpose === "coin_logo" ? "logo" : "image", idempotencyKey: crypto.randomUUID() }) });
      return waitForAiRun(created?.run || created);
    },
  },
  assets: {
    upload: (file, { projectId, kind = "attachment", visibility = "private" } = {}) => {
      const body = new FormData();
      body.set("file", file); body.set("kind", kind); body.set("visibility", visibility);
      if (projectId) body.set("projectId", projectId);
      return api("/api/assets", { method: "POST", body });
    },
  },
  credits: {
    summary: () => api("/api/credits"),
    quote: (payload) => api("/api/credits/quote", { method: "POST", body: json({ paymentAsset: payload.asset === "ETH" ? "eth" : "pan", amount: Number(payload.amount) }) }),
    history: () => api("/api/credits/transactions"),
  },
  wallets: {
    list: () => api("/api/wallets"),
    provision: () => api("/api/wallets/provision", { method: "POST" }),
    withdraw: (payload) => api("/api/wallets/withdrawals", { method: "POST", body: json({ destination: payload.address, amountEth: String(payload.amountEth), idempotencyKey: crypto.randomUUID(), confirmed: true }) }),
    connectChallenge: async (payload) => (await api("/api/wallets/external/challenge", { method: "POST", body: json(payload) }))?.challenge,
    connectVerify: (payload) => api("/api/wallets/external/verify", { method: "POST", body: json(payload) }),
    confirmSigningRequest: (requestId, transactionHash) => api("/api/wallets/external/signing-requests", { method: "POST", body: json({ requestId, transactionHash }) }),
  },
  sites: {
    get: (projectId, versionId) => api(`/api/projects/${encodeURIComponent(projectId)}/website${versionId ? `?versionId=${encodeURIComponent(versionId)}` : ""}`),
    run: async (projectId, payload) => {
      if (payload.operation === "save_files") return api(`/api/projects/${encodeURIComponent(projectId)}/website`, { method: "PATCH", body: json({ files: payload.files, basedOnVersionId: payload.basedOnVersionId, runtime: payload.runtime }) });
      const created = await api(`/api/projects/${encodeURIComponent(projectId)}/website`, { method: "POST", body: json({ prompt: payload.prompt, performance: payload.performance || "medium", basedOnVersionId: payload.basedOnVersionId, runtime: payload.runtime === "fullstack" ? "railway_node" : payload.runtime || "static", idempotencyKey: crypto.randomUUID() }) });
      await waitForAiRun(created?.run || created);
      return api(`/api/projects/${encodeURIComponent(projectId)}/website?versionId=${encodeURIComponent(created?.version?.id || "")}`);
    },
    env: (projectId) => api(`/api/projects/${encodeURIComponent(projectId)}/environment`),
    setEnv: async (projectId, payload) => Promise.all(payload.variables.map((variable) => api(`/api/projects/${encodeURIComponent(projectId)}/environment`, { method: "POST", body: json(variable) }))),
    githubStatus: async () => {
      const result = await api("/api/github/connection");
      return { ...result, connected: Boolean(result?.connection), username: result?.connection?.login, login: result?.connection?.login };
    },
    githubConnectUrl: `${API_BASE}/api/github/connect`,
    exportGithub: (projectId, payload) => api(`/api/projects/${encodeURIComponent(projectId)}/deployments`, { method: "POST", body: json(payload) }),
    assetUrl: (path) => path?.startsWith("http") ? path : `${API_BASE}${path || ""}`,
  },
  support: {
    list: () => api("/api/support"),
    create: (payload) => api("/api/support", { method: "POST", body: json(payload) }),
    reply: (id, payload) => api(`/api/support/${encodeURIComponent(id)}/messages`, { method: "POST", body: json(payload) }),
    close: (id) => api("/api/support", { method: "PATCH", body: json({ id, action: "close" }) }),
  },
  admin: {
    overview: () => api("/api/admin/overview"),
    users: (query = "") => api(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`),
    grant: (userId, amount, reason) => api("/api/admin/users", { method: "POST", body: json({ userId, delta: amount, reason, idempotencyKey: crypto.randomUUID() }) }),
    tickets: () => api("/api/admin/support"),
    replyTicket: (id, message) => api(`/api/admin/support/${encodeURIComponent(id)}/messages`, { method: "POST", body: json({ message }) }),
    closeTicket: (id, adminNote = "") => api("/api/admin/support", { method: "PATCH", body: json({ id, action: "close", adminNote }) }),
    projects: () => api("/api/admin/projects"),
    operations: () => api("/api/admin/operations"),
    operationAction: (action, targetId) => api("/api/admin/operations", { method: "PATCH", body: json({ action, targetId }) }),
    audit: () => api("/api/admin/audit"),
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
