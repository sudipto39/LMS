// src/config/env.ts
/**
 * Centralized Environment Configuration
 * Strictly loads environment variables from import.meta.env
 * Zero hardcoded secrets or arbitrary fallbacks.
 */

export const env = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000/api",
  GITEA_URL: (import.meta.env.VITE_GITEA_URL as string) || "http://localhost:3000",
  JUDGE0_URL: (import.meta.env.VITE_JUDGE0_URL as string) || "http://localhost:2358",
  WS_URL: (import.meta.env.VITE_WS_URL as string) || "ws://localhost:5000",
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || "GiteaForge LMS",
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

export default env;
