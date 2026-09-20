// src/controllers/activityController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { requireParam } from "../utils/requireParam.js";
import { ForbiddenError, NotFoundError } from "../utils/appError.js";
import { giteaService } from "../services/giteaService.js";

const activityInclude = {
  user: { select: { id: true, name: true, role: true } },
  project: { select: { id: true, title: true } },
} as const;

const formatActivityMessage = (a: any) => {
  const payload = (a.payload as any) || {};
  if (payload.msg && payload.msg !== "activity on") return payload.msg;

  const projTitle = a.project?.title || "project";
  switch (a.type) {
    case "CODE_COMMITTED":
    case "commit":
      return `pushed commits to ${projTitle}`;
    case "MILESTONE_SUBMITTED":
      return `submitted milestone deliverables on ${projTitle}`;
    case "MILESTONE_APPROVED":
      return `approved milestone deliverables on ${projTitle}`;
    case "MILESTONE_REJECTED":
      return `requested changes on deliverables for ${projTitle}`;
    case "PROJECT_CREATED":
      return `created new capstone project "${projTitle}"`;
    case "PROJECT_GRADED":
      return `assigned grade ${payload.grade || ""} to ${projTitle}`;
    case "FEEDBACK_POSTED":
      return `posted feedback remarks on ${projTitle}`;
    case "REPO_SYNCED":
      return `synced repository files on ${projTitle}`;
    default:
      return `updated project ${projTitle}`;
  }
};

const getAvatarUrl = (name?: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name || "User"
  )}&backgroundColor=06b6d4,2563eb,8b5cf6,10b981,f59e0b`;

export const getMyActivity = catchAsync(async (req: Request, res: Response) => {
  const activities = await prisma.activity.findMany({
    where: { userId: req.user!.id },
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const formatted = activities.map((a) => {
    const payload = (a.payload as any) || {};
    return {
      id: a.id,
      type: a.type || "commit",
      scope: "personal",
      msg: formatActivityMessage(a),
      time: a.createdAt.toISOString(),
      user: a.user?.name || "User",
      avatar: getAvatarUrl(a.user?.name),
      project: a.project?.title || "Project",
      detail: payload.detail || payload.message || payload.milestoneTitle || "",
    };
  });

  res.status(200).json({ status: "success", data: formatted });
});

export const getProjectActivity = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["projectId"], "projectId");
  const user = req.user!;

  if (user.role !== "ADMIN") {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { select: { userId: true } } },
    });
    if (!project) throw new NotFoundError("Project");

    const isOwner = project.ownerId === user.id;
    const isSupervisor = project.supervisorId === user.id;
    const isMember = project.members?.some((m) => m.userId === user.id) ?? false;

    if (!isOwner && !isSupervisor && !isMember) {
      throw new ForbiddenError("You do not have permission to view this project's activities");
    }
  }

  const limitParam = req.query["limit"] ? Math.max(1, Math.min(100, Number(req.query["limit"]))) : 50;
  const pageParam = req.query["page"] ? Math.max(1, Number(req.query["page"])) : 1;
  const skip = (pageParam - 1) * limitParam;

  const activities = await prisma.activity.findMany({
    where: { projectId },
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    skip,
    take: limitParam,
  });

  const formatted = activities.map((a) => {
    const payload = (a.payload as any) || {};
    return {
      id: a.id,
      type: a.type || "commit",
      scope: "project",
      msg: formatActivityMessage(a),
      time: a.createdAt.toISOString(),
      user: a.user?.name || "User",
      avatar: getAvatarUrl(a.user?.name),
      project: a.project?.title || "Project",
      detail: payload.detail || payload.message || "",
    };
  });

  res.status(200).json({
    status: "success",
    count: formatted.length,
    data: formatted,
  });
});

export const getSupervisorActivity = catchAsync(async (req: Request, res: Response) => {
  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { project: { supervisorId: req.user!.id } },
        { userId: req.user!.id },
      ],
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const formatted = activities.map((a) => {
    const payload = (a.payload as any) || {};
    return {
      id: a.id,
      type: a.type,
      scope: "supervisor",
      msg: formatActivityMessage(a),
      time: a.createdAt.toISOString(),
      user: a.user?.name || "User",
      avatar: getAvatarUrl(a.user?.name),
      project: a.project?.title || "Project",
      detail: payload.detail || payload.message || payload.milestoneTitle || "",
    };
  });

  res.status(200).json({
    status: "success",
    count: formatted.length,
    data: formatted,
  });
});

export const getAdminActivity = catchAsync(async (_req: Request, res: Response) => {
  const activities = await prisma.activity.findMany({
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const formatted = activities.map((a) => {
    const payload = (a.payload as any) || {};
    return {
      id: a.id,
      type: a.type || "commit",
      scope: "admin",
      msg: formatActivityMessage(a),
      time: a.createdAt.toISOString(),
      user: a.user?.name || "System",
      avatar: getAvatarUrl(a.user?.name),
      project: a.project?.title || "Platform",
      detail: payload.detail || payload.message || payload.desc || "",
    };
  });

  res.status(200).json({ status: "success", data: formatted });
});

export const getCommitHeatmap = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const username = user?.giteaUsername || user?.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") || "user";

  const dayCounts: Record<string, number> = {};

  // 1. Try fetching Gitea User Heatmap
  try {
    const rawHeatmap = await giteaService.getHeatmap(username);
    if (Array.isArray(rawHeatmap) && rawHeatmap.length > 0) {
      rawHeatmap.forEach((item) => {
        const d = new Date(item.timestamp * 1000).toISOString().slice(0, 10);
        dayCounts[d] = (dayCounts[d] || 0) + item.contributions;
      });
    }
  } catch (err) {
    console.warn(`Could not fetch Gitea user heatmap for ${username}:`, err);
  }

  // 2. Fetch live commits across all projects owned by or assigned to this user
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: { owner: true },
    });

    for (const proj of projects) {
      let owner = proj.owner?.giteaUsername || "";
      let repo = proj.repoName || "";

      if (proj.repoUrl) {
        try {
          const urlClean = proj.repoUrl.trim().replace(/\.git$/i, "");
          const urlObj = new URL(urlClean);
          const segments = urlObj.pathname.split("/").filter(Boolean);
          if (segments.length >= 2) {
            owner = segments[segments.length - 2] || owner;
            repo = segments[segments.length - 1] || repo;
          }
        } catch {
          const parts = proj.repoUrl.replace(/\.git$/i, "").split("/").filter(Boolean);
          if (parts.length >= 2) {
            const pRepo = parts.pop();
            const pOwner = parts.pop();
            if (pRepo) repo = pRepo;
            if (pOwner) owner = pOwner;
          }
        }
      }

      if (!owner) owner = proj.owner?.giteaUsername || proj.owner?.name.toLowerCase().replace(/\s+/g, "-") || username;
      if (!repo) repo = proj.repoName || "project-repo";

      try {
        const commits = await giteaService.getCommits(owner, repo, 50);
        if (Array.isArray(commits)) {
          for (const c of commits) {
            const dateRaw = c.commit?.author?.date || c.commit?.committer?.date || c.created;
            if (dateRaw) {
              const dStr = new Date(dateRaw).toISOString().slice(0, 10);
              dayCounts[dStr] = (dayCounts[dStr] || 0) + 1;
            }
          }
        }
      } catch (commitErr) {
        // Continue to next project
      }
    }
  } catch (projErr) {
    console.warn("Could not fetch project commits for heatmap:", projErr);
  }

  // 3. Aggregate LMS Database Activities for the user (pushes, commits, deliverables)
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
      },
      select: {
        type: true,
        createdAt: true,
      },
    });

    for (const act of activities) {
      const actDate = act.createdAt.toISOString().slice(0, 10);
      dayCounts[actDate] = (dayCounts[actDate] || 0) + 1;
    }
  } catch (actErr) {
    console.warn("Could not aggregate user activities for heatmap:", actErr);
  }

  const now = new Date();
  const weeks: Array<{
    weekIndex: number;
    days: Array<{ date: string; count: number; level: number }>;
  }> = [];

  let totalCommits = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let bestDay = 0;

  // Build 12-week grid (from 11 weeks ago to today)
  for (let w = 0; w < 12; w++) {
    const weekDays: Array<{ date: string; count: number; level: number }> = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = (11 - w) * 7 + (6 - d);
      const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().slice(0, 10);
      const count = dayCounts[dateStr] || 0;

      totalCommits += count;
      if (count > bestDay) bestDay = count;

      if (count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
      weekDays.push({ date: dateStr, count, level });
    }
    weeks.push({ weekIndex: w, days: weekDays });
  }

  // Calculate current streak backwards from today
  const allDays = weeks.flatMap((w) => w.days);
  for (let i = allDays.length - 1; i >= 0 && allDays[i]!.count > 0; i--) {
    currentStreak++;
  }

  res.status(200).json({
    status: "success",
    data: {
      totalCommits,
      currentStreak,
      longestStreak,
      bestDay,
      weeks,
    },
  });
});