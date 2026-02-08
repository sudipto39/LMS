/**
 * ============================================
 * GiteaForge — Axios API Client
 * ============================================
 * Central HTTP client. All API calls go through this.
 * Handles auth token injection, refresh, and error formatting.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT token ──
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('giteaforge_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 & errors ──
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — try refresh
      const refreshToken = localStorage.getItem('giteaforge_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('giteaforge_token', res.data.token);
          // Retry the original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${res.data.token}`;
            return client(error.config);
          }
        } catch {
          // Refresh also failed — force logout
          localStorage.removeItem('giteaforge_token');
          localStorage.removeItem('giteaforge_refresh_token');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('giteaforge_token');
        window.location.href = '/login';
      }
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
    return error.response?.data?.message || error.message || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error occurred';
}
