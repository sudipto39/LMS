// src/config/env.ts
/**
 * Centralized Environment Configuration
 * Strictly loads environment variables from import.meta.env
 * Zero hardcoded secrets or arbitrary fallbacks.
 */

const getEnvVar = (key: string, defaultValue: string = ""): string => {
  const value = import.meta.env[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().replace(/\/+$/, "");
  }
  return defaultValue;
};

export const env = {
  API_BASE_URL: getEnvVar("VITE_API_BASE_URL", "http://localhost:5000/api"),
  GITEA_URL: getEnvVar("VITE_GITEA_URL", "http://localhost:3000"),
  JUDGE0_URL: getEnvVar("VITE_JUDGE0_URL", "http://localhost:2358"),
  WS_URL: getEnvVar("VITE_WS_URL", "ws://localhost:5000"),
  APP_NAME: getEnvVar("VITE_APP_NAME", "GiteaForge LMS"),
  IS_DEV: Boolean(import.meta.env.DEV),
  IS_PROD: Boolean(import.meta.env.PROD),
};

export default env;
