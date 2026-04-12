// src/controllers/milestoneController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../utils/appError.js";
import { logActivity } from "../services/activityService.js";
import { requireParam } from "../utils/requireParam.js";

export const createMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["projectId"], "projectId");
    const { title, description, dueDate } = req.body as {
      title: string;
      description?: string;
      dueDate?: string;
    };

    if (!title) throw new BadRequestError("Milestone title is required");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) throw new NotFoundError("Project");
    if (project.ownerId !== req.user!.id) throw new ForbiddenError();

    const milestone = await prisma.milestone.create({
      data: {
        title,
        projectId,
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });

    res.status(201).json({ status: "success", data: milestone });
  }
);

export const getProjectMilestones = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["projectId"], "projectId");
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json({
      status: "success",
      count: milestones.length,
      data: milestones,
    });
  }
);

export const submitMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true } } },
    });

    if (!milestone) throw new NotFoundError("Milestone");
    if (milestone.project.ownerId !== req.user!.id) throw new ForbiddenError();
    if (milestone.status === "APPROVED") {
      throw new BadRequestError("Milestone already approved");
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });

    await logActivity({
      type: "MILESTONE_SUBMITTED",
      payload: { milestoneTitle: milestone.title },
      userId: req.user!.id,
      projectId: milestone.projectId,
    });

    res.status(200).json({ status: "success", data: updated });
  }
);

export const approveMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { feedback } = req.body as { feedback?: string };

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { select: { supervisorId: true } } },
    });

    if (!milestone) throw new NotFoundError("Milestone");

    const isAdmin = req.user!.role === "ADMIN";
    const isSupervisor = milestone.project.supervisorId === req.user!.id;
    if (!isAdmin && !isSupervisor) throw new ForbiddenError();

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "APPROVED",
        feedback: feedback ?? null,
        reviewedAt: new Date(),
      },
    });

    await logActivity({
      type: "MILESTONE_APPROVED",
      payload: { milestoneTitle: milestone.title, feedback: feedback ?? "" },
      userId: req.user!.id,
      projectId: milestone.projectId,
    });

    res.status(200).json({ status: "success", data: updated });
  }
);

export const rejectMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { feedback } = req.body as { feedback?: string };

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { select: { supervisorId: true } } },
    });

    if (!milestone) throw new NotFoundError("Milestone");

    const isAdmin = req.user!.role === "ADMIN";
    const isSupervisor = milestone.project.supervisorId === req.user!.id;
    if (!isAdmin && !isSupervisor) throw new ForbiddenError();

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "REJECTED",
        feedback: feedback ?? null,
        reviewedAt: new Date(),
      },
    });

    await logActivity({
      type: "MILESTONE_REJECTED",
      payload: { milestoneTitle: milestone.title, feedback: feedback ?? "" },
      userId: req.user!.id,
      projectId: milestone.projectId,
    });

    res.status(200).json({ status: "success", data: updated });
  }
);

export const getMySubmissions = catchAsync(
  async (req: Request, res: Response) => {
    const milestones = await prisma.milestone.findMany({
      where: {
        project: { ownerId: req.user!.id },
        status: { in: ["SUBMITTED", "APPROVED", "REJECTED"] },
      },
      include: {
        project: { select: { id: true, title: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    res.status(200).json({
      status: "success",
      count: milestones.length,
      data: milestones,
    });
  }
);