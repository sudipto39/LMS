// src/controllers/supervisorController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../utils/appError.js";
import { logActivity } from "../services/activityService.js";
import { requireParam } from "../utils/requireParam.js";

export const getAllSupervisors = catchAsync(
  async (_req: Request, res: Response) => {
    const supervisors = await prisma.user.findMany({
      where: { role: "SUPERVISOR" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json({
      status: "success",
      count: supervisors.length,
      data: supervisors,
    });
  }
);

export const getSupervisorDashboard = catchAsync(
  async (req: Request, res: Response) => {
    const supervisorId = req.user!.id;

    const [totalProjects, pendingMilestones, recentActivity] =
      await Promise.all([
        prisma.project.count({ where: { supervisorId } }),
        prisma.milestone.count({
          where: { status: "SUBMITTED", project: { supervisorId } },
        }),
        prisma.activity.findMany({
          where: { project: { supervisorId } },
          include: {
            project: { select: { id: true, title: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    res.status(200).json({
      status: "success",
      data: { totalProjects, pendingMilestones, recentActivity },
    });
  }
);

export const getAssignedProjects = catchAsync(
  async (req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
      where: { supervisorId: req.user!.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { milestones: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      status: "success",
      count: projects.length,
      data: projects,
    });
  }
);

export const getPendingMilestones = catchAsync(
  async (req: Request, res: Response) => {
    const milestones = await prisma.milestone.findMany({
      where: {
        status: "SUBMITTED",
        project: { supervisorId: req.user!.id },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { submittedAt: "asc" },
    });
    res.status(200).json({
      status: "success",
      count: milestones.length,
      data: milestones,
    });
  }
);

export const reviewMilestone = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { status, feedback } = req.body as {
      status: "APPROVED" | "REJECTED";
      feedback?: string;
    };

    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new BadRequestError("Status must be APPROVED or REJECTED");
    }

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
        status,
        feedback: feedback ?? null,
        reviewedAt: new Date(),
      },
    });

    await logActivity({
      type: `MILESTONE_${status}`,
      payload: { milestoneTitle: milestone.title, feedback: feedback ?? "" },
      userId: req.user!.id,
      projectId: milestone.projectId,
    });

    res.status(200).json({
      status: "success",
      message: `Milestone ${status.toLowerCase()} successfully`,
      data: updated,
    });
  }
);

export const getSupervisorActivityFeed = catchAsync(
  async (req: Request, res: Response) => {
    const activities = await prisma.activity.findMany({
      where: { project: { supervisorId: req.user!.id } },
      include: {
        project: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.status(200).json({
      status: "success",
      count: activities.length,
      data: activities,
    });
  }
);

export const getSuperviorGrades = catchAsync(async (req, res) => {
  const milestones = await prisma.milestone.findMany({
    where: {
      reviewedById: req.user!.id,
      status: { in: ["APPROVED", "REJECTED"] }
    },
    include: {
      project: { select: { title: true } },
      submittedBy: { select: { name: true } }
    }
  });
  res.status(200).json({ status: "success", data: milestones });
});