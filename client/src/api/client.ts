// src/api/client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getCSRFToken, setCSRFToken, ensureCSRFToken } from "../utils/security";
import env from "../config/env";

// ── In-Memory Token Store (No Plain Tokens in LocalStorage) ────────────────────
let _accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => _accessToken,
  set: (token: string | null) => {
    _accessToken = token;
  },
  clear: () => {
    _accessToken = null;
  },
};

// ── Axios Instance ────────────────────────────────────────────────────────────
export const client = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

// ── Request Interceptor ───────────────────────────────────────────────────────
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // 1. Attach memory access token if present
  const token = tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Attach CSRF token for mutating methods
  const mutating = ["post", "put", "patch", "delete"];
  if (config.headers && mutating.includes(config.method?.toLowerCase() ?? "")) {
    let csrf = getCSRFToken();
    if (!csrf) {
      csrf = await ensureCSRFToken();
    }
    if (csrf) {
      config.headers["X-CSRF-Token"] = csrf;
    }
  }

  return config;
});

// ── Response Interceptor with Silent Refresh Queue ────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

client.interceptors.response.use(
  (response) => {
    const newCsrf =
      (typeof response.headers?.get === "function"
        ? response.headers.get("x-csrf-token")
        : null) ||
      response.headers?.["x-csrf-token"] ||
      response.headers?.["X-CSRF-Token"] ||
      (response.data as any)?.csrfToken;
    if (newCsrf && typeof newCsrf === "string") {
      setCSRFToken(newCsrf);
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _csrfRetry?: boolean;
    };

    // ── Handle CSRF 403 error retry ──
    const errMessage = (error.response?.data as any)?.message;
    if (
      error.response?.status === 403 &&
      !original?._csrfRetry &&
      typeof errMessage === "string" &&
      errMessage.toLowerCase().includes("csrf")
    ) {
      original._csrfRetry = true;
      try {
        const freshCsrf = await ensureCSRFToken(true);
        if (freshCsrf && original?.headers) {
          original.headers["X-CSRF-Token"] = freshCsrf;
          return client(original);
        }
      } catch {
        // Fall through to reject
      }
    }

    if (error.response?.status === 401 && !original?._retry) {
      const skipUrls = [
        "/auth/logout",
        "/auth/refresh-token",
        "/auth/login",
        "/auth/register",
      ];

      const isSkipUrl = skipUrls.some((url) => original?.url?.includes(url));

      if (isSkipUrl) {
        if (!original?.url?.includes("/auth/login") && !original?.url?.includes("/auth/register")) {
          tokenStore.clear();
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Cap queue depth to prevent memory DoS under burst 401s (FLAW-R2-03)
        if (refreshQueue.length >= 50) {
          return Promise.reject(error);
        }
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            if (original?.headers) {
              original.headers.Authorization = `Bearer ${token}`;
            }
            resolve(client(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const fallbackRt = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("giteaforge_rt") : null;
        const res = await axios.post(
          `${env.API_BASE_URL}/v1/auth/refresh-token`,
          fallbackRt ? { refreshToken: fallbackRt } : {},
          {
            headers: fallbackRt ? { "X-Refresh-Token": fallbackRt } : undefined,
            withCredentials: true,
          }
        );
        const newToken = res.data.accessToken as string;
        const newCsrf =
          res.data.csrfToken ||
          (typeof res.headers?.get === "function" ? res.headers.get("x-csrf-token") : null) ||
          res.headers?.["x-csrf-token"];
        if (newCsrf && typeof newCsrf === "string") {
          setCSRFToken(newCsrf);
        }

        if (res.data.refreshToken && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("giteaforge_rt", res.data.refreshToken);
        }
        tokenStore.set(newToken);
        processQueue(newToken);
        if (original?.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
        return client(original);
      } catch {
        tokenStore.clear();
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("giteaforge_rt");
        }
        refreshQueue = [];
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Error Formatter ───────────────────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Session expired. Please log in again.";
    if (status === 403) return "Access denied. Insufficient permissions.";
    if (status === 404) return "Requested resource was not found.";
    if (status === 409)
      return (
        (error.response?.data as { message?: string })?.message ??
        "Conflict: resource already exists."
      );
    if (status === 400 || status === 422)
      return (
        (error.response?.data as { message?: string })?.message ??
        "Invalid request payload."
      );
    if (status === 429) return "Too many requests. Please slow down.";
    if (status && status >= 500)
      return "Server error occurred. Please try again shortly.";
    return (
      (error.response?.data as { message?: string })?.message ??
      "Network communication error."
    );
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export default client;
