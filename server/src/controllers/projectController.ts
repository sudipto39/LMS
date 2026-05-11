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

const projectInclude = {
  owner: { select: { id: true, name: true, email: true } },
  supervisor: { select: { id: true, name: true, email: true } },
  batch: { select: { id: true, name: true } },
  _count: { select: { milestones: true } },
} as const;

export const createProject = catchAsync(
  async (req: Request, res: Response) => {
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
        "Please set up your Gitea username in your profile before creating a project"
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
      description
    );

    await giteaService.createWebhook(
      user.giteaUsername,
      sanitizedName,
      `${env.CLIENT_URL}/api/v1/webhooks/gitea`
    );

    const project = await prisma.project.create({
      data: {
        title,
        ...(description !== undefined && { description }),
        repoName: repo.name,
        repoUrl: repo.html_url,
        ownerId: userId,
        batchId,
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
  }
);

export const getMyProjects = catchAsync(
  async (req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user!.id },
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      status: "success",
      count: projects.length,
      data: projects,
    });
  }
);

export const getSupervisedProjects = catchAsync(
  async (req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
      where: { supervisorId: req.user!.id },
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      status: "success",
      count: projects.length,
      data: projects,
    });
  }
);

export const getProjectById = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["id"], "id");

    // const project = await prisma.project.findUnique({
    //   where: { id },
    //   include: {
    //     ...projectInclude,
    //     milestones: { orderBy: { createdAt: "asc" } },
    //     activities: { orderBy: { createdAt: "desc" }, take: 10 },
    //   },
    // });
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

    res.status(200).json({ status: "success", data: project });
  }
);

export const updateProject = catchAsync(
  async (req: Request, res: Response) => {
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
  }
);