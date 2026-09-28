// src/services/giteaService.ts
import crypto from "crypto";
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

    const clientStatus =
      giteaStatus === 401 || giteaStatus === 403 ? 502 : giteaStatus;

    throw new AppError(`Gitea error: ${message}`, clientStatus);
  }
  throw new AppError(`Gitea error in ${context}`, 500);
};

// ─── Gitea service ────────────────────────────────────────────────────────────

export const giteaService = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await gitea.get("/version", { timeout: 3000 });
      return res.status === 200;
    } catch {
      return false;
    }
  },

  async createRepo(
    ownerUsername: string,
    name: string,
    description?: string
  ) {
    try {
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

  async getCommitDiff(owner: string, repo: string, sha = "HEAD") {
    try {
      if (sha === "HEAD" || !sha) {
        const commits = await gitea.get(`/repos/${owner}/${repo}/commits`, { params: { limit: 10 } });
        if (Array.isArray(commits.data) && commits.data.length > 0) {
          const latestSha = commits.data[0].sha;
          let detailedFiles: any[] = commits.data[0].files || [];
          let stats = commits.data[0].stats || { total: 0, additions: 0, deletions: 0 };
          try {
            const detailed = await gitea.get(`/repos/${owner}/${repo}/commits/${latestSha}`);
            if (detailed.data?.files) detailedFiles = detailed.data.files;
            if (detailed.data?.stats) stats = detailed.data.stats;
          } catch {
            // Keep summary files
          }
          return {
            sha: latestSha,
            commit: commits.data[0].commit,
            stats,
            files: detailedFiles,
            recentCommits: commits.data.map((c: any) => ({
              sha: c.sha?.slice(0, 7) || c.sha,
              fullSha: c.sha,
              message: c.commit?.message || "Commit",
              author: c.commit?.author?.name || c.author?.username || "Developer",
              date: c.commit?.author?.date || c.created,
              filesCount: Array.isArray(c.files) ? c.files.length : 0,
            })),
          };
        }
      } else {
        const detailed = await gitea.get(`/repos/${owner}/${repo}/commits/${sha}`);
        return detailed.data;
      }
      return null;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      return handleGiteaError(error, "getCommitDiff");
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
    password?: string
  ) {
    try {
      const userPassword = password || crypto.randomBytes(16).toString("hex");
      const res = await gitea.post("/admin/users", {
        username,
        email,
        password: userPassword,
        must_change_password: false,
        send_notify: false,
      });
      console.log(`✅ Gitea: User "${username}" created`);
      return res.data;
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 422) {
        console.log(`ℹ️ Gitea: User "${username}" already exists`);
        return { username, email };
      }
      return handleGiteaError(err, "createGiteaUser");
    }
  },

  async deleteRepo(owner: string, repo: string) {
    try {
      await gitea.delete(`/repos/${owner}/${repo}`);
      console.log(`🗑️  Gitea: Repo "${repo}" deleted for ${owner}`);
    } catch (error) {
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

  async getRepoFileRaw(owner: string, repo: string, filepath: string, ref = "main"): Promise<string | null> {
    try {
      const cleanPath = filepath.replace(/^\/+/, "");
      const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
      const res = await gitea.get(`/repos/${owner}/${repo}/raw/${encodedPath}`, {
        params: { ref },
        responseType: "text",
        transformResponse: [(data) => data],
      });
      return typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2);
    } catch {
      return null;
    }
  },

  async getRepoTree(owner: string, repo: string, ref = "main") {
    try {
      const res = await gitea.get(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}`, {
        params: { recursive: 1 },
      });
      return res.data as {
        sha: string;
        url: string;
        tree: Array<{
          path: string;
          mode: string;
          type: "blob" | "tree";
          size?: number;
          sha: string;
          url: string;
        }>;
        truncated: boolean;
      };
    } catch (error) {
      if (error instanceof AxiosError && (error.response?.status === 404 || error.response?.status === 409)) {
        return { sha: "", url: "", tree: [], truncated: false };
      }
      return handleGiteaError(error, "getRepoTree");
    }
  },

  async getAllRepoFilesWithContent(owner: string, repo: string, ref = "main") {
    try {
      // 1. Try recursive tree API first
      let treeData;
      try {
        treeData = await this.getRepoTree(owner, repo, ref);
      } catch {
        treeData = null;
      }

      if (treeData && Array.isArray(treeData.tree) && treeData.tree.length > 0) {
        const blobNodes = treeData.tree.filter((node) => node.type === "blob");
        const filePromises = blobNodes.slice(0, 50).map(async (node) => {
          let rawContent = await this.getRepoFileRaw(owner, repo, node.path, ref);
          if (rawContent === null) {
            rawContent = `// File: ${node.path}\n// Synced from Gitea repository`;
          }
          const filename = node.path.split("/").pop() || node.path;
          const ext = filename.split(".").pop()?.toLowerCase() || "";
          let language = "plaintext";
          if (["ts", "tsx"].includes(ext)) language = "typescript";
          else if (["js", "jsx"].includes(ext)) language = "javascript";
          else if (["py"].includes(ext)) language = "python";
          else if (["r"].includes(ext)) language = "r";
          else if (["html"].includes(ext)) language = "html";
          else if (["css"].includes(ext)) language = "css";
          else if (["json"].includes(ext)) language = "json";
          else if (["md"].includes(ext)) language = "markdown";

          const sizeKb = node.size ? `${(node.size / 1024).toFixed(1)} KB` : "1.0 KB";

          return {
            path: node.path,
            name: filename,
            size: sizeKb,
            language,
            content: rawContent,
          };
        });

        const files = await Promise.all(filePromises);
        if (files.length > 0) return files;
      }

      // 2. Fallback: Try getRepoContents at root
      const rootContents = await this.getRepoContents(owner, repo, "");
      if (Array.isArray(rootContents) && rootContents.length > 0) {
        const filePromises = rootContents
          .filter((item: any) => item.type === "file")
          .map(async (item: any) => {
            let content = "";
            if (item.content && item.encoding === "base64") {
              try {
                content = Buffer.from(item.content, "base64").toString("utf-8");
              } catch {
                content = "";
              }
            }
            if (!content) {
              content = (await this.getRepoFileRaw(owner, repo, item.path, ref)) || `// File: ${item.name}`;
            }
            const ext = item.name.split(".").pop()?.toLowerCase() || "";
            let language = "plaintext";
            if (["ts", "tsx"].includes(ext)) language = "typescript";
            else if (["js", "jsx"].includes(ext)) language = "javascript";
            else if (["py"].includes(ext)) language = "python";
            else if (["r"].includes(ext)) language = "r";
            else if (["html"].includes(ext)) language = "html";
            else if (["css"].includes(ext)) language = "css";
            else if (["json"].includes(ext)) language = "json";
            else if (["md"].includes(ext)) language = "markdown";

            return {
              path: item.path,
              name: item.name,
              size: `${Math.max(1, Math.round((item.size || 1024) / 1024))} KB`,
              language,
              content,
            };
          });
        return await Promise.all(filePromises);
      }

      return [];
    } catch (err) {
      console.warn(`Could not fetch repo files for ${owner}/${repo}:`, err);
      return [];
    }
  },

  async updateRepoFile(
    owner: string,
    repo: string,
    filepath: string,
    content: string,
    message = "Updated via GiteaForge Sandbox",
    branch?: string
  ) {
    try {
      const cleanPath = filepath.replace(/^\/+/, "");
      const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
      const base64Content = Buffer.from(content).toString("base64");

      let defaultBranch = branch || "main";
      if (!branch) {
        try {
          const repoRes = await gitea.get(`/repos/${owner}/${repo}`);
          defaultBranch = repoRes.data.default_branch || "main";
        } catch (err: unknown) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          try {
            await gitea.get(`/users/${owner}`);
          } catch (userCheckErr: unknown) {
            if (userCheckErr instanceof AxiosError && userCheckErr.response?.status === 404) {
              try {
                const autoPassword = crypto.randomBytes(16).toString("hex");
                await gitea.post("/admin/users", {
                  username: owner,
                  email: `${owner}@lms.local`,
                  password: autoPassword,
                  must_change_password: false,
                  send_notify: false,
                });
              } catch (createUserErr: unknown) {
                if (!(createUserErr instanceof AxiosError && createUserErr.response?.status === 422)) {
                  console.error(`❌ Failed to create Gitea user "${owner}":`, createUserErr);
                }
              }
            }
          }

          try {
            const createRes = await gitea.post(`/admin/users/${owner}/repos`, {
              name: repo,
              description: "Auto-created project repository",
              private: true,
              auto_init: true,
              default_branch: "main",
            });
            defaultBranch = createRes.data?.default_branch || "main";
            await new Promise((resolve) => setTimeout(resolve, 1500));
          } catch (createRepoErr: unknown) {
            if (!(createRepoErr instanceof AxiosError && createRepoErr.response?.status === 409)) {
              throw new AppError(
                `Repository ${owner}/${repo} does not exist on Gitea and could not be auto-created.`,
                404
              );
            }
          }
        } else {
          throw err;
        }
      }
    }

      let sha: string | undefined;
      try {
        const existing = await gitea.get(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
          params: { ref: defaultBranch },
        });
        sha = existing.data?.sha;
      } catch {
        // file is new
      }

      if (sha) {
        const res = await gitea.put(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
          content: base64Content,
          message,
          sha,
          branch: defaultBranch,
        });
        return res.data;
      } else {
        const res = await gitea.post(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
          content: base64Content,
          message,
          branch: defaultBranch,
        });
        return res.data;
      }
    } catch (error) {
      return handleGiteaError(error, "updateRepoFile");
    }
  },

  /**
   * Pushes multiple workspace files to Gitea repo with standard .gitignore filtering.
   */
  async pushWorkspaceFiles(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    message = "Update project workspace via Sandbox IDE",
    branch?: string
  ) {
    // 1. Extract .gitignore patterns if .gitignore exists in workspace
    const gitignoreFile = files.find(
      (f) => f.path.trim() === ".gitignore" || f.path.trim().endsWith("/.gitignore")
    );
    const customPatterns = gitignoreFile
      ? gitignoreFile.content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#"))
      : [];

    const defaultPatterns = [
      "node_modules",
      "node_modules/*",
      "dist",
      "dist/*",
      "build",
      "build/*",
      ".env",
      ".env.*",
      "*.pyc",
      "__pycache__",
      "__pycache__/*",
      ".DS_Store",
      "*.log",
      "*.tmp",
      ".cache",
      "target",
    ];

    const allPatterns = [...defaultPatterns, ...customPatterns];

    const isIgnored = (filePath: string): boolean => {
      const normalized = filePath.replace(/^\/+/, "").replace(/\\/g, "/");
      const filename = normalized.split("/").pop() || "";
      for (const pattern of allPatterns) {
        const cleanPattern = pattern.replace(/^\/+/, "").replace(/\/+$/, "");
        if (
          normalized === cleanPattern ||
          normalized.startsWith(cleanPattern + "/") ||
          filename === cleanPattern
        ) {
          return true;
        }
        if (cleanPattern.startsWith("*.") && filename.endsWith(cleanPattern.slice(1))) {
          return true;
        }
      }
      return false;
    };

    const filesToCommit: Array<{ path: string; content: string }> = [];
    const filesIgnored: string[] = [];

    for (const file of files) {
      if (!file.path || file.content === undefined) continue;
      if (isIgnored(file.path)) {
        filesIgnored.push(file.path);
      } else {
        filesToCommit.push(file);
      }
    }

    const commitResults: any[] = [];
    for (const file of filesToCommit) {
      try {
        const res = await this.updateRepoFile(
          owner,
          repo,
          file.path,
          file.content,
          message,
          branch
        );
        commitResults.push({ path: file.path, success: true, sha: res?.content?.sha });
      } catch (err: any) {
        commitResults.push({
          path: file.path,
          success: false,
          error: err?.message || "Failed to commit",
        });
      }
    }

    return {
      committedCount: filesToCommit.length,
      ignoredCount: filesIgnored.length,
      filesCommitted: filesToCommit.map((f) => f.path),
      filesIgnored,
      results: commitResults,
      branch: branch || "main",
      message,
    };
  },

  // ─── SSH Keys & User PAT Management ───────────────────────────────────────────

  async getSSHKeys(username: string) {
    try {
      const res = await gitea.get(`/users/${username}/keys`);
      return res.data as Array<{
        id: number;
        title: string;
        key: string;
        fingerprint: string;
        created_at: string;
      }>;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return [];
      }
      return handleGiteaError(error, "getSSHKeys");
    }
  },

  async addSSHKey(username: string, title: string, key: string) {
    try {
      const res = await gitea.post(`/admin/users/${username}/keys`, {
        title,
        key: key.trim(),
        read_only: false,
      });
      return res.data;
    } catch (error) {
      return handleGiteaError(error, "addSSHKey");
    }
  },

  async deleteSSHKey(username: string, keyId: number | string) {
    try {
      await gitea.delete(
        `/admin/users/${encodeURIComponent(username)}/keys/${encodeURIComponent(String(keyId))}`
      );
      return { success: true };
    } catch (error) {
      return handleGiteaError(error, "deleteSSHKey");
    }
  },

  async listPersonalAccessTokens(username: string) {
    try {
      const res = await gitea.get(`/admin/users/${username}/tokens`);
      return (res.data || []) as Array<{ id: number; name: string }>;
    } catch {
      try {
        const res = await gitea.get(`/users/${username}/tokens`);
        return (res.data || []) as Array<{ id: number; name: string }>;
      } catch {
        return [];
      }
    }
  },

  async deletePersonalAccessToken(username: string, tokenIdOrName: number | string) {
    try {
      await gitea.delete(`/admin/users/${username}/tokens/${tokenIdOrName}`);
      return true;
    } catch {
      try {
        await gitea.delete(`/users/${username}/tokens/${tokenIdOrName}`);
        return true;
      } catch {
        return false;
      }
    }
  },

  async createPersonalAccessToken(username: string, name: string = "GiteaForge LMS Git Token") {
    try {
      // Clean up previous tokens generated for LMS to prevent unbounded active PAT accumulation
      try {
        const existingTokens = await this.listPersonalAccessTokens(username);
        for (const t of existingTokens) {
          if (t.name && (t.name.startsWith(name) || t.name.startsWith("GiteaForge LMS Git Token"))) {
            await this.deletePersonalAccessToken(username, t.id ?? t.name);
          }
        }
      } catch {
        // Continue if token cleanup fails
      }

      const res = await gitea.post(`/admin/users/${username}/tokens`, {
        name: `${name}_${Date.now()}`,
        scopes: ["repo", "read:user"],
      });
      return res.data as { id: number; name: string; sha1: string; token?: string };
    } catch (error) {
      return handleGiteaError(error, "createPersonalAccessToken");
    }
  },

  async rotateUserPassword(username: string) {
    try {
      const randomPassword = crypto.randomBytes(24).toString("hex");
      await gitea.patch(`/admin/users/${username}`, {
        password: randomPassword,
        must_change_password: false,
      });
      return true;
    } catch (error) {
      console.warn(`Could not rotate Gitea password for ${username}:`, error);
      return false;
    }
  },

  async updateUserPassword(username: string, password?: string) {
    // SECURITY: Never pass a caller-provided (user-originating) password here.
    // This function must only be called with no argument (uses random rotation).
    // Syncing LMS passwords to Gitea re-introduces FLAW-01. Use rotateUserPassword() instead.
    if (password !== undefined && password !== null) {
      throw new AppError(
        "updateUserPassword must not receive a caller-provided password. Use rotateUserPassword() for safe random rotation.",
        500
      );
    }
    try {
      const giteaPassword = crypto.randomBytes(24).toString("hex");
      await gitea.patch(`/admin/users/${username}`, {
        password: giteaPassword,
        must_change_password: false,
      });
      return true;
    } catch (error) {
      console.warn(`Could not sync password update to Gitea for ${username}:`, error);
      return false;
    }
  },

  async deleteUser(username: string) {
    try {
      await gitea.delete(`/admin/users/${username}`);
      return true;
    } catch (error) {
      console.warn(`Could not delete Gitea user for ${username}:`, error);
      return false;
    }
  },
  async ensureGiteaUser(username: string, email?: string, password?: string) {
    try {
      await gitea.get(`/users/${username}`);
      return true;
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        try {
          const userPassword = password || crypto.randomBytes(16).toString("hex");
          await this.createGiteaUser(username, email || `${username}@lms.local`, userPassword);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  },

  async getHeatmap(username: string) {
    try {
      const res = await gitea.get(`/users/${username}/heatmap`);
      return res.data as Array<{ timestamp: number; contributions: number }>;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return [];
      }
      return handleGiteaError(error, "getHeatmap");
    }
  },
};