// src/controllers/adminController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";

export const getAdminStats = catchAsync(
  async (_req: Request, res: Response) => {
    const [
      totalUsers,
      totalStudents,
      totalSupervisors,
      totalProjects,
      totalMilestones,
      pendingMilestones,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "SUPERVISOR" } }),
      prisma.project.count(),
      prisma.milestone.count(),
      prisma.milestone.count({ where: { status: "SUBMITTED" } }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        totalStudents,
        totalSupervisors,
        totalProjects,
        totalMilestones,
        pendingMilestones,
      },
    });
  }
);

export const getAllProjectsForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { supervisorId, ownerId } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        ...(supervisorId && { supervisorId: supervisorId as string }),
        ...(ownerId && { ownerId: ownerId as string }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        supervisor: { select: { id: true, name: true, email: true } },
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

export const assignSupervisorToProject = catchAsync(
  async (req: Request, res: Response) => {
    const { supervisorId } = req.body as { supervisorId: string };
    const projectId = requireParam(req.params["id"], "id");

    if (!supervisorId) throw new BadRequestError("supervisorId is required");

    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
      select: { id: true, role: true },
    });

    if (!supervisor || supervisor.role !== "SUPERVISOR") {
      throw new NotFoundError("Supervisor");
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: { supervisorId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({ status: "success", data: project });
  }
);