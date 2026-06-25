// src/controllers/activityController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { requireParam } from "../utils/requireParam.js";

const activityInclude = {
  user: { select: { id: true, name: true, role: true } },
  project: { select: { id: true, title: true } },
} as const;

export const getMyActivity = catchAsync(
  async (req: Request, res: Response) => {
    const activities = await prisma.activity.findMany({
      where: { userId: req.user!.id },
      include: activityInclude,
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.status(200).json({ status: "success", data: activities });
  }
);

export const getProjectActivity = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["projectId"], "projectId");
    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: activityInclude,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      status: "success",
      count: activities.length,
      data: activities,
    });
  }
);

// export const getSupervisorActivity = catchAsync(
//   async (req: Request, res: Response) => {
//     const activities = await prisma.activity.findMany({
//       where: { project: { supervisorId: req.user!.id } },
//       include: activityInclude,
//       orderBy: { createdAt: "desc" },
//       take: 30,
//     });
//     res.status(200).json({ status: "success", data: activities });
//   }
// );

export const getSupervisorActivity = catchAsync(
  async (req: Request, res: Response) => {
    const activities = await prisma.activity.findMany({
      where: {
        project: { supervisorId: req.user!.id },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, title: true } },
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

export const getAdminActivity = catchAsync(
  async (_req: Request, res: Response) => {
    const activities = await prisma.activity.findMany({
      include: activityInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.status(200).json({ status: "success", data: activities });
  }
);