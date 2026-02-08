/**
 * ============================================
 * Gitea Integration API Service
 * ============================================
 * Proxy endpoints — backend calls Gitea API on behalf of the user
 *
 * BACKEND ROUTE FILE: routes/gitea.js
 * BACKEND CONTROLLER: controllers/giteaController.js
 */

import client from './client';

export interface GiteaRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  private: boolean;
  description: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

export interface GiteaCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  html_url: string;
}

export interface GiteaPushEvent {
  id: string;
  type: string;
  repo: string;
  branch: string;
  commits: { sha: string; message: string }[];
  pusher: string;
  timestamp: string;
}

export interface GiteaSettings {
  _id: string;
  baseUrl: string;
  adminToken: string;     // stored encrypted on backend
  orgName: string;
  defaultTeamPermission: string;
  webhookSecret: string;  // stored encrypted on backend
  webhookConfigured: boolean;
  lastConnectionTest?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

const giteaAPI = {
  // ─── Repo operations (proxied via backend) ───

  /**
   * POST /api/gitea/repos
   * Body: { name, description, private: true, projectId }
   * Creates a new repo under the org in Gitea
   * Returns: GiteaRepo
   */
  createRepo: (data: { name: string; description: string; projectId: string }) =>
    client.post<GiteaRepo>('/gitea/repos', { ...data, private: true }),

  /**
   * GET /api/gitea/repos/:owner/:repo
   * Get repo info from Gitea
   */
  getRepo: (owner: string, repo: string) =>
    client.get<GiteaRepo>(`/gitea/repos/${owner}/${repo}`),

  /**
   * GET /api/gitea/repos/:owner/:repo/commits
   * Query: { page, limit, branch }
   */
  getCommits: (owner: string, repo: string, params?: { page?: number; limit?: number; branch?: string }) =>
    client.get<GiteaCommit[]>(`/gitea/repos/${owner}/${repo}/commits`, { params }),

  /**
   * GET /api/gitea/repos/:owner/:repo/branches
   */
  getBranches: (owner: string, repo: string) =>
    client.get<{ name: string }[]>(`/gitea/repos/${owner}/${repo}/branches`),

  /**
   * GET /api/gitea/repos/:owner/:repo/archive/main.zip
   * Download repo as ZIP
   */
  downloadRepoZip: (owner: string, repo: string, branch = 'main') =>
    client.get(`/gitea/repos/${owner}/${repo}/archive/${branch}.zip`, {
      responseType: 'blob',
    }),

  /**
   * GET /api/gitea/user/repos
   * List repos the authenticated user has access to (for "link existing" flow)
   */
  listUserRepos: () =>
    client.get<GiteaRepo[]>('/gitea/user/repos'),

  // ─── Activity / Webhooks ───

  /**
   * GET /api/gitea/activity
   * Query: { projectId?, userId?, page, limit }
   * Returns push events stored from webhook payloads
   */
  getActivity: (params?: { projectId?: string; userId?: string; page?: number; limit?: number }) =>
    client.get<GiteaPushEvent[]>('/gitea/activity', { params }),

  // ─── Admin: Gitea Settings ───

  /**
   * GET /api/gitea/settings
   * Admin only
   */
  getSettings: () =>
    client.get<GiteaSettings>('/gitea/settings'),

  /**
   * PATCH /api/gitea/settings
   * Admin only
   * Body: Partial<GiteaSettings>
   */
  updateSettings: (data: Partial<GiteaSettings>) =>
    client.patch<GiteaSettings>('/gitea/settings', data),

  /**
   * POST /api/gitea/test-connection
   * Admin only. Tests connection to Gitea server.
   * Returns: { success: boolean, version: string, message: string }
   */
  testConnection: () =>
    client.post<{ success: boolean; version: string; message: string }>('/gitea/test-connection'),

  /**
   * POST /api/gitea/setup-webhook
   * Admin only. Registers webhook on the Gitea org.
   * Returns: { success: boolean, webhookId: number }
   */
  setupWebhook: () =>
    client.post<{ success: boolean; webhookId: number }>('/gitea/setup-webhook'),
};

export default giteaAPI;
