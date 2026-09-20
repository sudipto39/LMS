// src/api/client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getCSRFToken, setCSRFToken } from "../utils/security";
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
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 1. Attach memory access token if present
  const token = tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Attach CSRF token for mutating methods
  const csrf = getCSRFToken();
  const mutating = ["post", "put", "patch", "delete"];
  if (csrf && config.headers && mutating.includes(config.method?.toLowerCase() ?? "")) {
    config.headers["X-CSRF-Token"] = csrf;
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
    const newCsrf = response.headers["x-csrf-token"];
    if (newCsrf) setCSRFToken(newCsrf as string);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

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
        const res = await axios.post(
          `${env.API_BASE_URL}/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken as string;
        tokenStore.set(newToken);
        processQueue(newToken);
        if (original?.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }
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
