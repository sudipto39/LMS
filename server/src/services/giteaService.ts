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
    const giteaStatus = error.response?.status ?? 500;
    const message =
      error.response?.data?.message ?? error.message ?? "Gitea API error";
    console.error(`❌ Gitea [${context}]:`, message);

    // Remap Gitea's own 401/403 (bad admin token / insufficient permissions)
    // to 502 Bad Gateway so the client never treats it as a user session error
    // and triggers an unintended logout.
    const clientStatus =
      giteaStatus === 401 || giteaStatus === 403 ? 502 : giteaStatus;

    throw new AppError(`Gitea error: ${message}`, clientStatus);
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
      // Check if a webhook with this URL already exists to avoid duplicates
      const existingHooks = await gitea.get(`/repos/${owner}/${repo}/hooks`);
      const hooks = existingHooks.data as Array<{ config?: { url?: string } }>;
      const alreadyExists = hooks.some((h) => h.config?.url === webhookUrl);
      if (alreadyExists) {
        console.log(`ℹ️  Gitea: Webhook already exists for ${owner}/${repo} — skipping`);
        return null;
      }

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
  async deleteRepo(owner: string, repo: string) {
    try {
      await gitea.delete(`/repos/${owner}/${repo}`);
      console.log(`🗑️  Gitea: Repo "${repo}" deleted for ${owner}`);
    } catch (error) {
      // If the repo doesn't exist (404), treat as already deleted — not an error
      if (error instanceof AxiosError && error.response?.status === 404) {
        console.warn(`⚠️  Gitea: Repo "${repo}" not found — skipping delete`);
        return;
      }
      return handleGiteaError(error, "deleteRepo");
    }
  },
  async getRepoContents(owner: string, repo: string, path = "") {
    try {
      const cleanPath = path.replace(/^\/+/, "");
      const url = cleanPath
        ? `/repos/${owner}/${repo}/contents/${cleanPath.split("/").map(encodeURIComponent).join("/")}`
        : `/repos/${owner}/${repo}/contents`;
      const res = await gitea.get(url);
      return res.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404 && !path) {
        return [];
      }
      return handleGiteaError(error, "getRepoContents");
    }
  },
  async updateRepoFile(
    owner: string,
    repo: string,
    filepath: string,
    content: string,
    message = "Updated via GiteaForge Sandbox"
  ) {
    try {
      const cleanPath = filepath.replace(/^\/+/, "");
      const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
      const base64Content = Buffer.from(content).toString("base64");

      console.log(`📝 updateRepoFile: owner=${owner}, repo=${repo}, filepath=${cleanPath}`);

      // 1. Ensure the repository exists on Gitea (self-healing)
      let defaultBranch = "main";
      try {
        const repoRes = await gitea.get(`/repos/${owner}/${repo}`);
        defaultBranch = repoRes.data.default_branch || "main";
        console.log(`✅ Repo ${owner}/${repo} exists, default branch: ${defaultBranch}`);
      } catch (err: unknown) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          console.log(`⚠️ Repo ${owner}/${repo} not found on Gitea. Attempting auto-create...`);

          // First ensure the Gitea user exists
          try {
            await gitea.get(`/users/${owner}`);
            console.log(`✅ Gitea user "${owner}" exists`);
          } catch (userCheckErr: unknown) {
            if (userCheckErr instanceof AxiosError && userCheckErr.response?.status === 404) {
              console.log(`⚠️ Gitea user "${owner}" not found. Creating...`);
              try {
                await gitea.post("/admin/users", {
                  username: owner,
                  email: `${owner}@lms.local`,
                  password: "Student@1234",
                  must_change_password: false,
                  send_notify: false,
                });
                console.log(`✅ Created Gitea user "${owner}"`);
              } catch (createUserErr: unknown) {
                // 422 = user already exists (race condition), that's fine
                if (createUserErr instanceof AxiosError && createUserErr.response?.status === 422) {
                  console.log(`ℹ️ Gitea user "${owner}" already exists (422)`);
                } else {
                  console.error(`❌ Failed to create Gitea user "${owner}":`, createUserErr);
                }
              }
            }
          }

          // Now create the repository
          try {
            const createRes = await gitea.post(`/admin/users/${owner}/repos`, {
              name: repo,
              description: "Auto-created project repository",
              private: true,
              auto_init: true,
              default_branch: "main",
            });
            defaultBranch = createRes.data?.default_branch || "main";
            console.log(`✅ Auto-created repo ${owner}/${repo}`);

            // Give Gitea a moment to initialize the repo with auto_init
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (createRepoErr: unknown) {
            if (createRepoErr instanceof AxiosError && createRepoErr.response?.status === 409) {
              console.log(`ℹ️ Repo ${owner}/${repo} already exists (409 conflict)`);
            } else {
              console.error(`❌ Failed to auto-create repo ${owner}/${repo}:`, createRepoErr);
              throw new AppError(
                `Repository ${owner}/${repo} does not exist on Gitea and could not be auto-created. Please create it first.`,
                404
              );
            }
          }
        } else {
          // Non-404 error (e.g., Gitea offline)
          throw err;
        }
      }

      // 2. Check if the file already exists to obtain its SHA
      let sha: string | undefined;
      try {
        const existing = await gitea.get(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
          params: { ref: defaultBranch },
        });
        sha = existing.data?.sha;
        console.log(`📄 File "${cleanPath}" exists (sha: ${sha?.substring(0, 7)})`);
      } catch {
        console.log(`📄 File "${cleanPath}" is new (will create)`);
      }

      // 3. Put or Post file to Gitea
      if (sha) {
        const res = await gitea.put(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
          content: base64Content,
          message,
          sha,
          branch: defaultBranch,
        });
        console.log(`✅ Updated file "${cleanPath}" in ${owner}/${repo}`);
        return res.data;
      } else {
        const res = await gitea.post(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
          content: base64Content,
          message,
          branch: defaultBranch,
        });
        console.log(`✅ Created file "${cleanPath}" in ${owner}/${repo}`);
        return res.data;
      }
    } catch (error) {
      return handleGiteaError(error, "updateRepoFile");
    }
  },
};