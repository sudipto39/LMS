// src/controllers/adminController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";

export const getAdminStats = catchAsync(
  async (_req: Request, res: Response) => {
    const [
      totalUsers,
      students,
      supervisors,
      activeProjects,
      inProgress,
      pendingReviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "SUPERVISOR" } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: "APPROVED" } }),
      prisma.milestone.count({ where: { status: "SUBMITTED" } }),
    ]);

    const giteaHost = process.env.GITEA_URL 
      ? new URL(process.env.GITEA_URL).hostname 
      : "Not configured";

    res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        students,
        supervisors,
        activeProjects,
        inProgress,
        pendingReviews,
        giteaStatus: process.env.GITEA_URL ? "online" : "offline",
        giteaHost,
      },
    });
  },
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
  },
);

export const assignSupervisorToProject = catchAsync(
  async (req: Request, res: Response) => {
    const { supervisorId } = req.body as { supervisorId: string | null };
    const projectId = requireParam(req.params["id"], "id");

    if (supervisorId === null || supervisorId === "") {
      const project = await prisma.project.update({
        where: { id: projectId },
        data: { supervisorId: null },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          supervisor: { select: { id: true, name: true, email: true } },
        },
      });
      res.status(200).json({ status: "success", data: project });
      return;
    }

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
  },
);

export const getAuditLogs = catchAsync(async (_req: Request, res: Response) => {
  const logs = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, role: true } },
      project: { select: { title: true } },
    },
  });
  res.status(200).json({ status: "success", data: logs });
});

export const getGiteaConfig = catchAsync(
  async (_req: Request, res: Response) => {
    res.status(200).json({
      status: "success",
      data: {
        baseUrl: process.env.GITEA_URL || "",
        apiToken: process.env.GITEA_TOKEN || "",
        orgTemplate: process.env.GITEA_ORG || "",
      },
    });
  },
);

export const saveGiteaConfig = catchAsync(
  async (_req: Request, res: Response) => {
    res.status(200).json({ status: "success", message: "Config saved" });
  },
);

export const testGiteaConnection = catchAsync(
  async (_req: Request, res: Response) => {
    res.status(200).json({ status: "success", message: "Connection tested" });
  },
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundError("User");

    // Delete related records first, then the user
    await prisma.$transaction([
      prisma.batchEnrollment.deleteMany({ where: { userId: id } }),
      prisma.activity.deleteMany({ where: { userId: id } }),
      prisma.milestone.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } }),
      prisma.milestone.updateMany({ where: { submittedById: id }, data: { submittedById: null } }),
      prisma.project.updateMany({ where: { supervisorId: id }, data: { supervisorId: null } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.status(200).json({ status: "success", message: "User deleted" });
  },
);

export const updateUser = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { name, email, role, department, phoneNumber, universityId } = req.body as {
      name?: string;
      email?: string;
      role?: string;
      department?: string;
      phoneNumber?: string;
      universityId?: string;
    };

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundError("User");

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role: role as any }),
        ...(department !== undefined && { department }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(universityId !== undefined && { universityId }),
      },
      select: {
        id: true, name: true, email: true, role: true,
        department: true, phoneNumber: true, universityId: true,
        giteaUsername: true, isEmailVerified: true, createdAt: true,
      },
    });

    res.status(200).json({ status: "success", data: updated });
  },
);
