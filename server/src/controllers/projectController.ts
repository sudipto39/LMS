// src/controllers/projectController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../utils/appError.js";
import { giteaService } from "../services/giteaService.js";
import { logActivity } from "../services/activityService.js";
import { requireParam } from "../utils/requireParam.js";
import { env } from "../config/env.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "../middlewares/fileUploadMiddleware.js";

const projectInclude = {
  owner: { select: { id: true, name: true, email: true } },
  supervisor: { select: { id: true, name: true, email: true } },
  batch: { select: { id: true, name: true } },
  _count: { select: { milestones: true } },
} as const;

export const createProject = catchAsync(async (req: Request, res: Response) => {
  console.log("📋 Received body:", JSON.stringify(req.body, null, 2));
  const userId = req.user!.id;
  const { title, description, batchId, repoName } = req.body as {
    title: string;
    description?: string;
    batchId: string;
    repoName?: string;
  };

  if (!title) throw new BadRequestError("Project title is required");
  if (!batchId) throw new BadRequestError("Batch ID is required");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { giteaUsername: true },
  });

  if (!user?.giteaUsername) {
    throw new BadRequestError(
      "Please set up your Gitea username in your profile before creating a project",
    );
  }

  const sanitizedName = (repoName ?? title)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const repo = await giteaService.createRepo(
    user.giteaUsername,
    sanitizedName,
    description,
  );

  await giteaService.createWebhook(
    user.giteaUsername,
    sanitizedName,
    `${env.CLIENT_URL}/api/v1/webhooks/gitea`,
  );

  const { supervisorId } = req.body as { supervisorId?: string };

  const project = await prisma.project.create({
    data: {
      title,
      ...(description !== undefined && { description }),
      repoName: repo.name,
      repoUrl: repo.html_url,
      ownerId: userId,
      batchId,
      ...(supervisorId && { supervisorId }),
    },
    include: projectInclude,
  });

  await logActivity({
    type: "PROJECT_CREATED",
    payload: { projectTitle: title, repoName: repo.name },
    userId,
    projectId: project.id,
  });

  res.status(201).json({ status: "success", data: project });
});

export const getMyProjects = catchAsync(async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { ownerId: req.user!.id },
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  });

  // Compute progress for each project (approved milestones / total active milestones)
  const projectsWithProgress = await Promise.all(
    projects.map(async (project) => {
      const [total, approved] = await Promise.all([
        prisma.milestone.count({ where: { projectId: project.id, isActive: true } }),
        prisma.milestone.count({ where: { projectId: project.id, isActive: true, status: "APPROVED" } }),
      ]);
      return {
        ...project,
        progress: total > 0 ? Math.round((approved / total) * 100) : 0,
        milestonesTotal: total,
        milestonesCompleted: approved,
      };
    })
  );

  res.status(200).json({
    status: "success",
    count: projectsWithProgress.length,
    data: projectsWithProgress,
  });
});

export const getSupervisedProjects = catchAsync(
  async (req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
      where: { supervisorId: req.user!.id },
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Compute all per-project metrics in parallel
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const [
          total,
          approved,
          pendingReviewCount,
          lastPushActivity,
        ] = await Promise.all([
          prisma.milestone.count({ where: { projectId: project.id, isActive: true } }),
          prisma.milestone.count({ where: { projectId: project.id, isActive: true, status: "APPROVED" } }),
          // Count milestones awaiting supervisor review (student has submitted, supervisor hasn't reviewed)
          prisma.milestone.count({ where: { projectId: project.id, isActive: true, status: "SUBMITTED" } }),
          // Find the most recent git push for this project
          prisma.activity.findFirst({
            where: { projectId: project.id, type: "PUSH" },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
        ]);

        const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
        const needsReview = pendingReviewCount > 0;

        // inactiveDays: days since last push; if never pushed, use days since project created
        const lastActiveDate = lastPushActivity?.createdAt ?? project.createdAt;
        const inactiveDays = Math.floor(
          (now.getTime() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // upcomingDeadline: endDate exists and is within the next 14 days
        const upcomingDeadline =
          project.endDate !== null &&
          project.endDate > now &&
          project.endDate <= twoWeeksFromNow;

        return {
          ...project,
          progress,
          milestonesTotal: total,
          milestonesCompleted: approved,
          needsReview,
          inactiveDays,
          upcomingDeadline,
          lastPushAt: lastPushActivity?.createdAt ?? null,
        };
      })
    );

    res.status(200).json({
      status: "success",
      count: projectsWithProgress.length,
      data: projectsWithProgress,
    });
  },
);

export const getProjectById = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["id"], "id");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, giteaUsername: true },
        },
        supervisor: {
          select: { id: true, name: true, email: true },
        },
        batch: {
          select: {
            id: true,
            name: true,
            startYear: true,
            endYear: true,
            course: {
              select: { id: true, title: true },
            },
          },
        },
        _count: { select: { milestones: true } },
      },
    });

    if (!project) throw new NotFoundError("Project");

    const isOwner = project.ownerId === req.user!.id;
    const isSupervisor = project.supervisorId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";
    if (!isOwner && !isSupervisor && !isAdmin) throw new ForbiddenError();

    // ── Calculate progress from milestones ────────────────────────────────
    const milestoneStats = await prisma.milestone.aggregate({
      where: { projectId, isActive: true },
      _count: { id: true },
    });

    const approvedCount = await prisma.milestone.count({
      where: { projectId, isActive: true, status: "APPROVED" },
    });

    const totalMilestones = milestoneStats._count.id;
    const progress =
      totalMilestones > 0
        ? Math.round((approvedCount / totalMilestones) * 100)
        : 0;

    res.status(200).json({
      status: "success",
      data: {
        ...project,
        progress,
        milestonesCompleted: approvedCount,
        milestonesTotal: totalMilestones,
      },
    });
  },
);

export const gradeProject = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const { rubric, total, supervisorFeedback } = req.body as {
    rubric: Record<string, number>;
    total: number;
    supervisorFeedback?: string;
  };

  if (typeof total !== "number" || total < 0 || total > 100) {
    throw new BadRequestError("Total must be a number between 0 and 100");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: { supervisorId: true, ownerId: true },
  });

  if (!project) throw new NotFoundError("Project");

  const isSupervisor = project.supervisorId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isSupervisor && !isAdmin) throw new ForbiddenError();

  const gradePayload = JSON.stringify({
    rubric,
    total,
    supervisorFeedback: supervisorFeedback ?? "",
    gradedAt: new Date().toISOString(),
    gradedById: req.user!.id,
  });

  const updated = await prisma.project.update({
    where: { id },
    data: { feedback: gradePayload },
    include: {
      owner: { select: { id: true, name: true } },
      supervisor: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    type: "PROJECT_GRADED",
    payload: { total, rubric, feedback: supervisorFeedback ?? "" },
    userId: req.user!.id,
    projectId: id,
  });

  res.status(200).json({ status: "success", data: updated });
});

// GET /api/v1/projects/:id/feedback — returns the feedback thread (activity log entries)
export const getProjectFeedback = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, supervisorId: true },
  });
  if (!project) throw new NotFoundError("Project");

  const isOwner = project.ownerId === req.user!.id;
  const isSupervisor = project.supervisorId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isOwner && !isSupervisor && !isAdmin) throw new ForbiddenError();

  const feedbackActivities = await prisma.activity.findMany({
    where: {
      projectId,
      type: { in: ["SUPERVISOR_FEEDBACK", "STUDENT_FEEDBACK"] },
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const comments = feedbackActivities.map((a) => ({
    id: a.id,
    user: a.user,
    message: (a.payload as any)?.message ?? "",
    type: a.type,
    createdAt: a.createdAt,
  }));

  res.status(200).json({ status: "success", count: comments.length, data: comments });
});

// POST /api/v1/projects/:id/feedback — any project member can post a feedback message
export const postProjectFeedback = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  const { content } = req.body as { content: string };

  if (!content?.trim()) throw new BadRequestError("Feedback content is required");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, supervisorId: true },
  });
  if (!project) throw new NotFoundError("Project");

  const isOwner = project.ownerId === req.user!.id;
  const isSupervisor = project.supervisorId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isOwner && !isSupervisor && !isAdmin) throw new ForbiddenError();

  const activityType = isOwner ? "STUDENT_FEEDBACK" : "SUPERVISOR_FEEDBACK";

  await logActivity({
    type: activityType,
    payload: { message: content.trim() },
    userId: req.user!.id,
    projectId,
  });

  res.status(201).json({
    status: "success",
    data: {
      message: content.trim(),
      type: activityType,
      createdAt: new Date().toISOString(),
    },
  });
});

export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const { title, description } = req.body as {
    title?: string;
    description?: string;
  };

  const existing = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!existing) throw new NotFoundError("Project");
  if (existing.ownerId !== req.user!.id) throw new ForbiddenError();

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
    },
    include: projectInclude,
  });

  res.status(200).json({ status: "success", data: project });
});

export const getProjectFiles = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["id"], "id");

    // Verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, supervisorId: true },
    });

    if (!project) throw new NotFoundError("Project");

    const isOwner = project.ownerId === req.user!.id;
    const isSupervisor = project.supervisorId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";
    if (!isOwner && !isSupervisor && !isAdmin) throw new ForbiddenError();

    // Get all milestones with attachments
    const milestones = await prisma.milestone.findMany({
      where: {
        projectId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        attachments: true,
        submittedAt: true,
        status: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    // Generate presigned URLs (valid 1 hour)
    const files = await Promise.all(
      milestones.flatMap((m) => {
        const atts = m.attachments as Array<{
          name: string;
          url: string;
          key: string;
          size: number;
          mimetype: string;
        }> | null;

        return (atts ?? []).map(async (f) => {
          const signedUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: BUCKET, Key: f.key }),
            { expiresIn: 3600 },
          );
          return {
            name: f.name,
            url: signedUrl,
            size: f.size,
            mimetype: f.mimetype,
            milestoneId: m.id,
            milestoneTitle: m.title,
            submittedAt: m.submittedAt,
          };
        });
      }),
    );

    res.status(200).json({
      status: "success",
      count: files.length,
      data: files,
    });
  },
);
