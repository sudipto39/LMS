// src/utils/projectHelpers.ts
import { env } from "../config/env.js";
import type { ProjectStatus } from "../generated/prisma/index.js";

/**
 * Returns a standardized clone/repo URL for a project repository on Gitea.
 */
export const formatRepoUrl = (p: {
  repoUrl?: string | null;
  repoName?: string | null;
  owner?: { giteaUsername?: string | null } | null;
}): string => {
  const giteaRoot = env.GITEA_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const ownerUsername = p.owner?.giteaUsername || "user";
  const repoName = p.repoName || "project";
  const raw = p.repoUrl || `${giteaRoot}/${ownerUsername}/${repoName}.git`;
  return raw.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, giteaRoot);
};

/**
 * Derives the active project status: if status is DRAFT but milestones exist or are approved,
 * it is considered IN_PROGRESS.
 */
export const deriveProjectStatus = (
  currentStatus: ProjectStatus | string,
  milestoneCounts: { total: number; approved?: number }
): ProjectStatus | string => {
  if (
    currentStatus === "DRAFT" &&
    (milestoneCounts.total > 0 || (milestoneCounts.approved && milestoneCounts.approved > 0))
  ) {
    return "IN_PROGRESS";
  }
  return currentStatus;
};

/**
 * Standardizes the extraction of Gitea repository owner and repo name from
 * project attributes (repoUrl, owner record, and repoName).
 */
export const resolveProjectRepoInfo = (p: {
  repoUrl?: string | null;
  repoName?: string | null;
  owner?: { giteaUsername?: string | null; name?: string | null } | null;
}): { owner: string; repo: string } => {
  let owner = p.owner?.giteaUsername || "";
  let repo = p.repoName || "";

  if (p.repoUrl) {
    try {
      const urlClean = p.repoUrl.trim().replace(/\.git$/i, "");
      const urlObj = new URL(urlClean);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      if (segments.length >= 2) {
        owner = segments[segments.length - 2] || owner;
        repo = segments[segments.length - 1] || repo;
      }
    } catch {
      const parts = p.repoUrl.replace(/\.git$/i, "").split("/").filter(Boolean);
      if (parts.length >= 2) {
        const pRepo = parts.pop();
        const pOwner = parts.pop();
        if (pRepo) repo = pRepo;
        if (pOwner) owner = pOwner;
      }
    }
  }

  if (!owner) {
    owner =
      p.owner?.giteaUsername ||
      p.owner?.name?.toLowerCase().replace(/\s+/g, "-") ||
      "user";
  }

  if (!repo) {
    repo = p.repoName || "project-repo";
  }

  return { owner, repo };
};
