import { env } from "./env.js";

export const giteaConfig = {
  baseUrl: env.GITEA_BASE_URL,
  token: env.GITEA_ADMIN_TOKEN,
  webhookSecret: env.GITEA_WEBHOOK_SECRET,
} as const;