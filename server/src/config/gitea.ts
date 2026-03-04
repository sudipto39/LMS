import { config } from "./env.js";

export const giteaConfig = {
  baseUrl: config.GITEA_BASE_URL || "http://localhost:3001/api/v1",
  token: config.GITEA_ADMIN_TOKEN || "",
  webhookSecret: config.GITEA_WEBHOOK_SECRET || "",
};