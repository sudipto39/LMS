// src/services/giteaService.ts
import axios, { AxiosError } from "axios";
import { giteaConfig } from "../config/gitea.js";
import { AppError } from "../utils/appError.js";

// ─── Axios instance ───────────────────────────────────────────────────────────

const gitea = axios.create({
  baseURL: giteaConfig.baseUrl,
  headers: {
    Authorization: `token ${giteaConfig.token}`,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ─── Error handler ────────────────────────────────────────────────────────────

const handleGiteaError = (error: unknown, context: string): never => {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const message =
      error.response?.data?.message ?? error.message ?? "Gitea API error";
    console.error(`❌ Gitea [${context}]:`, message);
    throw new AppError(`Gitea error: ${message}`, status);
  }
  throw new AppError(`Gitea error in ${context}`, 500);
};

// ─── Gitea service ────────────────────────────────────────────────────────────

export const giteaService = {
  async createRepo(
    ownerUsername: string,
    name: string,
    description?: string
  ) {
    try {
      // Create repo under a specific user (admin acting on behalf of user)
      const res = await gitea.post(
        `/admin/users/${ownerUsername}/repos`,
        {
          name,
          description: description ?? "",
          private: true,
          auto_init: true,
          default_branch: "main",
        }
      );
      console.log(`✅ Gitea: Repo "${name}" created for ${ownerUsername}`);
      return res.data as {
        id: number;
        name: string;
        full_name: string;
        html_url: string;
        clone_url: string;
        private: boolean;
      };
    } catch (error) {
      return handleGiteaError(error, "createRepo");
    }
  },

  async getRepo(owner: string, repo: string) {
    try {
      const res = await gitea.get(`/repos/${owner}/${repo}`);
      return res.data;
    } catch (error) {
      return handleGiteaError(error, "getRepo");
    }
  },

  async getCommits(owner: string, repo: string, limit = 20) {
    try {
      const res = await gitea.get(
        `/repos/${owner}/${repo}/commits`,
        { params: { limit } }
      );
      return res.data;
    } catch (error) {
      return handleGiteaError(error, "getCommits");
    }
  },

  async getBranches(owner: string, repo: string) {
    try {
      const res = await gitea.get(`/repos/${owner}/${repo}/branches`);
      return res.data;
    } catch (error) {
      return handleGiteaError(error, "getBranches");
    }
  },

  async createWebhook(owner: string, repo: string, webhookUrl: string) {
    try {
      const res = await gitea.post(`/repos/${owner}/${repo}/hooks`, {
        type: "gitea",
        active: true,
        events: ["push"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: giteaConfig.webhookSecret,
        },
      });
      return res.data;
    } catch (error) {
      return handleGiteaError(error, "createWebhook");
    }
  },

  async createGiteaUser(
    username: string,
    email: string,
    password: string
  ) {
    try {
      const res = await gitea.post("/admin/users", {
        username,
        email,
        password,
        must_change_password: false,
        send_notify: false,
      });
      return res.data;
    } catch (error) {
      return handleGiteaError(error, "createGiteaUser");
    }
  },
};