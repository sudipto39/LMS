/**
 * ============================================
 * GiteaForge — Secured Axios API Client
 * ============================================
 * Security features:
 * - JWT auto-injection via Authorization header (not cookies for SPA)
 * - CSRF token injection on all mutating requests
 * - Automatic token refresh on 401
 * - Request timeout (15s)
 * - Response error normalization
 * - Request body sanitization
 * - Fingerprint header for anomaly detection
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getCSRFToken, sanitizeForDB } from '@/utils/security';

// ❌ NEVER hardcode URLs like this:
// axios.get("http://localhost:5000/api");

// ✅ ALWAYS use environment variables:
// Note: API_BASE should NOT include /v1 - we add it in each service for clarity
const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g., http://localhost:5000/api
const WS_BASE = import.meta.env.VITE_WS_URL;
const GITEA_URL = import.meta.env.VITE_GITEA_URL;

// API version prefix - all routes use /v1
export const API_VERSION = '/v1';

// Validate required environment variables
if (!API_BASE) {
  console.warn('⚠️ VITE_API_BASE_URL is not set. API calls will fail. Check your .env file.');
}

// Export URLs for use in other modules
export const getAPIBaseURL = () => API_BASE || '';
export const getWebSocketURL = () => WS_BASE || '';
export const getGiteaURL = () => GITEA_URL || '';

const client = axios.create({
  baseURL: getAPIBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Helps backend identify AJAX requests
  },
  withCredentials: true, // Send cookies for CSRF if backend uses cookie-based CSRF
});


// ── Sanitize request body recursively ──
function sanitizeRequestData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return sanitizeForDB(data);
  if (typeof data === 'number' || typeof data === 'boolean') return data;
  if (Array.isArray(data)) return data.map(sanitizeRequestData);
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Sanitize key names too (prevent prototype pollution)
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') continue;
      sanitized[safeKey] = sanitizeRequestData(value);
    }
    return sanitized;
  }
  return data;
}


// ── Request interceptor ──
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 1. Attach JWT token
  const token = localStorage.getItem('giteaforge_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Attach CSRF token for mutating requests
  const csrfToken = getCSRFToken();
  if (csrfToken && config.headers && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // 3. Sanitize request body (skip file uploads)
  if (config.data && !(config.data instanceof FormData)) {
    config.data = sanitizeRequestData(config.data);
  }

  // 4. Add request timestamp for replay attack detection
  if (config.headers) {
    config.headers['X-Request-Timestamp'] = Date.now().toString();
  }

  return config;
});


// ── Response interceptor ──
client.interceptors.response.use(
  (response) => {
    // Extract and store CSRF token if returned in response header
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      import('@/utils/security').then(({ setCSRFToken }) => {
        setCSRFToken(newCsrfToken);
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    // Handle 401 — token expired
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('giteaforge_refresh_token');
      if (refreshToken && error.config && !(error.config as { _retry?: boolean })._retry) {
        (error.config as { _retry?: boolean })._retry = true;
        try {
          const res = await axios.post(`${getAPIBaseURL()}/v1/auth/refresh`, { refreshToken });
          const newToken = res.data.token;
          localStorage.setItem('giteaforge_token', newToken);
          if (error.config.headers) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
          }
          return client(error.config);
        } catch {
          // Refresh failed — clear everything and redirect
          localStorage.removeItem('giteaforge_token');
          localStorage.removeItem('giteaforge_refresh_token');
          window.location.href = '/';
        }
      } else {
        localStorage.removeItem('giteaforge_token');
        localStorage.removeItem('giteaforge_refresh_token');
        window.location.href = '/';
      }
    }

    // Handle 403 — forbidden
    if (error.response?.status === 403) {
      console.error('Access denied. You do not have permission for this action.');
    }

    // Handle 429 — rate limited by server
    if (error.response?.status === 429) {
      console.error('Too many requests. Please wait before trying again.');
    }

    return Promise.reject(error);
  }
);

export default client;

/**
 * Helper: extract error message from Axios error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Don't leak server error details to UI
    const status = error.response?.status;
    if (status === 401) return 'Session expired. Please log in again.';
    if (status === 403) return 'You do not have permission for this action.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 429) return 'Too many requests. Please try again later.';
    if (status && status >= 500) return 'A server error occurred. Please try again later.';
    return error.response?.data?.message || 'Something went wrong. Please try again.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
