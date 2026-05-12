// src/api/client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getCSRFToken, setCSRFToken, sanitizeForDB } from "@/utils/security";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE) {
  console.warn("⚠️ VITE_API_BASE_URL is not set. Check your .env file.");
}

// ─── Token store (memory only) ────────────────────────────────────────────────
let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string | null) => {
    _accessToken = token;
  },
  clear: () => {
    _accessToken = null;
  },
};

// ─── URL helpers ──────────────────────────────────────────────────────────────
export const getAPIBaseURL = () =>
  (import.meta.env.VITE_API_BASE_URL as string) || "";

export const getWebSocketURL = () =>
  (import.meta.env.VITE_WS_URL as string) || "";

export const getGiteaURL = () =>
  (import.meta.env.VITE_GITEA_URL as string) || "";

// ─── Axios instance ───────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

// ─── Request sanitizer ────────────────────────────────────────────────────────
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") return sanitizeForDB(data);
  if (typeof data === "number" || typeof data === "boolean") return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      const safeKey = k.replace(/[^a-zA-Z0-9_]/g, "");
      if (["__proto__", "constructor", "prototype"].includes(safeKey)) continue;
      out[safeKey] = sanitizeData(v);
    }
    return out;
  }
  return data;
}

// ─── Auth endpoints that must NOT be sanitized ────────────────────────────────
const SKIP_SANITIZE = [
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/auth/forgot-password",
  "/auth/verify-email",
  "/auth/refresh-token",
];

// ─── Request interceptor ──────────────────────────────────────────────────────
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 1. Attach access token from memory
  const token = tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. CSRF token for mutating requests
  const csrf = getCSRFToken();
  const mutating = ["post", "put", "patch", "delete"];
  if (csrf && config.headers && mutating.includes(config.method ?? "")) {
    config.headers["X-CSRF-Token"] = csrf;
  }

  // 3. Sanitize body — skip auth endpoints and FormData
  const shouldSkip = SKIP_SANITIZE.some((path) =>
  config.url?.includes(path)
);

if (config.data && !(config.data instanceof FormData) && !shouldSkip) {
  config.data = sanitizeData(config.data);
}

  // 4. Request timestamp
  if (config.headers) {
    config.headers["X-Request-Timestamp"] = Date.now().toString();
  }

  return config;
});

// ─── Refresh state ────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

// ─── Response interceptor ─────────────────────────────────────────────────────
client.interceptors.response.use(
  (response) => {
    const newCsrf = response.headers["x-csrf-token"];
    if (newCsrf) setCSRFToken(newCsrf as string);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      // // Don't retry auth endpoints
      // if (original.url?.includes("/auth/")) {
      //   tokenStore.clear();
      //   window.dispatchEvent(new CustomEvent("auth:logout"));
      //   return Promise.reject(error);
      // }
      // ── Never retry these endpoints — they cause infinite loops ──
      const skipUrls = [
        "/auth/logout",
        "/auth/refresh-token",
        "/auth/login",
        "/auth/register",
      ];

      const isSkipUrl = skipUrls.some((url) => original.url?.includes(url));

      if (isSkipUrl) {
        // Only dispatch logout if NOT a logout/login request
        if (
          !original.url?.includes("/auth/logout") &&
          !original.url?.includes("/auth/login")
        ) {
          tokenStore.clear();
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE}/v1/auth/refresh-token`,
          {},
          { withCredentials: true },
        );
        const newToken = res.data.accessToken as string;
        tokenStore.set(newToken);
        processQueue(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch {
        tokenStore.clear();
        refreshQueue = [];
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default client;

// ─── Error message helper ─────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Session expired. Please log in again.";
    if (status === 403) return "You do not have permission for this action.";
    if (status === 404) return "The requested resource was not found.";
    if (status === 409)
      return (
        (error.response?.data as { message?: string })?.message ??
        "Already exists."
      );
    if (status === 400 || status === 422)
      return (
        (error.response?.data as { message?: string })?.message ??
        "Invalid data provided."
      );
    if (status === 429) return "Too many requests. Please try again later.";
    if (status && status >= 500)
      return "A server error occurred. Please try again later.";
    return (
      (error.response?.data as { message?: string })?.message ??
      "Something went wrong."
    );
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
