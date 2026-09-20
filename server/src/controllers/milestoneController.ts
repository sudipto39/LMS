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
import { emailService } from "../services/sendVerificationEmail.js";

export const createMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["projectId"], "projectId");
    const { title, description, dueDate, order } = req.body as {
      title: string;
      description?: string;
      dueDate?: string;
      order?: number;
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
        order: order ?? 0,
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
        throw new ForbiddenError("You do not have permission to view this project's milestones");
      }
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId, isActive: true },
      include: {
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { order: "asc" },
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
    const { studentNotes } = req.body as { studentNotes?: string };

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            id: true,
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!milestone) throw new NotFoundError("Milestone");

    // Allow both the project owner and group members to submit
    const isOwner = milestone.project.ownerId === req.user!.id;
    const isMember = milestone.project.members?.some((m) => m.userId === req.user!.id) ?? false;
    if (!isOwner && !isMember) throw new ForbiddenError();

    if (milestone.status === "APPROVED") {
      throw new BadRequestError("Milestone already approved");
    }
    if (milestone.status === "SUBMITTED") {
      throw new BadRequestError("Milestone already submitted and awaiting review");
    }

    // ── S3 uploaded files ──────────────────────────────────────────────────
    const uploadedFiles = (req.files as Express.MulterS3.File[]) ?? [];
    const attachments = uploadedFiles.map((f) => ({
      name: f.originalname,
      url: f.location,
      key: f.key,
      size: f.size,
      mimetype: f.mimetype,
    }));

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedById: req.user!.id,
        ...(studentNotes !== undefined && { studentNotes }),
        ...(attachments.length > 0 && {
          attachments: attachments as unknown as import("../generated/prisma/index.js").Prisma.InputJsonValue,
        }),
      },
    });

    await logActivity({
      type: "MILESTONE_SUBMITTED",
      payload: {
        milestoneTitle: milestone.title,
        fileCount: attachments.length,
        files: attachments.map((f) => f.name),
      },
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
      include: {
        project: {
          select: {
            title: true,
            supervisorId: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!milestone) throw new NotFoundError("Milestone");

    const isAdmin = req.user!.role === "ADMIN";
    const isSupervisor = milestone.project.supervisorId === req.user!.id;
    if (!isAdmin && !isSupervisor) throw new ForbiddenError();

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        ...(feedback !== undefined && { feedback }),
      },
    });

    await logActivity({
      type: "MILESTONE_APPROVED",
      payload: { milestoneTitle: milestone.title, feedback: feedback ?? "" },
      userId: req.user!.id,
      projectId: milestone.projectId,
    });

    if (milestone.project.owner?.email) {
      void emailService.sendMilestoneReviewNotification({
        to: milestone.project.owner.email,
        name: milestone.project.owner.name,
        milestoneTitle: milestone.title,
        projectTitle: milestone.project.title,
        status: "APPROVED",
        feedback,
      });
    }

    res.status(200).json({ status: "success", data: updated });
  }
);

export const rejectMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { feedback } = req.body as { feedback?: string };

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            title: true,
            supervisorId: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!milestone) throw new NotFoundError("Milestone");

    const isAdmin = req.user!.role === "ADMIN";
    const isSupervisor = milestone.project.supervisorId === req.user!.id;
    if (!isAdmin && !isSupervisor) throw new ForbiddenError();

    const updated = await prisma.milestone.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
        ...(feedback !== undefined && { feedback }),
      },
    });

    await logActivity({
      type: "MILESTONE_REJECTED",
      payload: { milestoneTitle: milestone.title, feedback: feedback ?? "" },
      userId: req.user!.id,
      projectId: milestone.projectId,
    });

    if (milestone.project.owner?.email) {
      void emailService.sendMilestoneReviewNotification({
        to: milestone.project.owner.email,
        name: milestone.project.owner.name,
        milestoneTitle: milestone.title,
        projectTitle: milestone.project.title,
        status: "REJECTED",
        feedback,
      });
    }

    res.status(200).json({ status: "success", data: updated });
  }
);

export const getMySubmissions = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const milestones = await prisma.milestone.findMany({
      where: {
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        status: { in: ["SUBMITTED", "APPROVED", "REJECTED"] },
        isActive: true,
      },
      include: {
        project: { select: { id: true, title: true } },
        reviewedBy: { select: { id: true, name: true } },
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

export const startMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!milestone) throw new NotFoundError("Milestone");

    const isOwner = milestone.project.ownerId === req.user!.id;
    const isMember = milestone.project.members?.some((m) => m.userId === req.user!.id) ?? false;
    if (!isOwner && !isMember) throw new ForbiddenError();

    if (milestone.status !== "PENDING" && milestone.status !== "REJECTED") {
      throw new BadRequestError("Only pending or rejected milestones can be started");
    }

    const updated = await prisma.milestone.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });

    await logActivity({
      type: "MILESTONE_STARTED",
      payload: { milestoneTitle: milestone.title },
      userId: req.user!.id,
      projectId: milestone.projectId,
    });

    res.status(200).json({ status: "success", data: updated });
  }
);

export const updateMilestone = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const { title, description, dueDate } = req.body as {
    title?: string;
    description?: string;
    dueDate?: string;
  };

  const milestone = await prisma.milestone.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          ownerId: true,
          supervisorId: true,
        },
      },
    },
  });

  if (!milestone) throw new NotFoundError("Milestone");

  if (milestone.status === "APPROVED") {
    throw new BadRequestError("Cannot modify an already approved milestone");
  }

  const isOwner = milestone.project.ownerId === req.user!.id;
  const isSupervisor = milestone.project.supervisorId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isOwner && !isSupervisor && !isAdmin) {
    throw new ForbiddenError("Only the project owner, supervisor, or admin can modify milestone details");
  }

  const updated = await prisma.milestone.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
    },
  });

  res.status(200).json({ status: "success", data: updated });
});

export const deleteMilestone = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");

  const milestone = await prisma.milestone.findUnique({
    where: { id },
    include: { project: { select: { ownerId: true } } },
  });

  if (!milestone) throw new NotFoundError("Milestone");
  if (milestone.project.ownerId !== req.user!.id && req.user!.role !== "ADMIN") {
    throw new ForbiddenError();
  }

  if (milestone.status === "APPROVED" || milestone.status === "SUBMITTED") {
    throw new BadRequestError(`Cannot delete a milestone that has already been ${milestone.status.toLowerCase()}`);
  }

  await prisma.milestone.update({
    where: { id },
    data: { isActive: false },
  });

  res.status(200).json({ status: "success", message: "Milestone deleted" });
});