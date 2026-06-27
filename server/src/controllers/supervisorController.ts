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

// export const getPendingMilestones = catchAsync(
//   async (req: Request, res: Response) => {
//     const milestones = await prisma.milestone.findMany({
//       where: {
//         status: "SUBMITTED",
//         project: { supervisorId: req.user!.id },
//       },
//       include: {
//         project: {
//           select: {
//             id: true,
//             title: true,
//             owner: { select: { id: true, name: true, email: true } },
//           },
//         },
//       },
//       orderBy: { submittedAt: "asc" },
//     });
//     res.status(200).json({
//       status: "success",
//       count: milestones.length,
//       data: milestones,
//     });
//   }
// );

export const getPendingMilestones = catchAsync(
  async (req: Request, res: Response) => {
    const milestones = await prisma.milestone.findMany({
      where: {
        status: "SUBMITTED",
        isActive: true,
        project: { supervisorId: req.user!.id },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            owner: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const formatted = milestones.map((m) => ({
      _id: m.id,
      id: m.id,
      title: m.title,
      status: m.status,
      projectId: m.projectId,
      projectTitle: m.project.title,
      studentName: m.project.owner?.name ?? "Unknown",
      type: "Milestone Submission",
      createdAt: m.submittedAt ?? m.createdAt,
      urgent: false,
    }));

    res.status(200).json({
      status: "success",
      count: formatted.length,
      data: formatted,
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

// Helper: convert numeric score to letter grade
function scoreToGrade(total: number): string {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "F";
}

export const getSuperviorGrades = catchAsync(async (req: Request, res: Response) => {
  // Fetch supervised projects that have been graded (feedback JSON set)
  const projects = await prisma.project.findMany({
    where: {
      supervisorId: req.user!.id,
      feedback: { not: null },
    },
    include: {
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const grades = projects.map((p) => {
    let rubric: Record<string, number> = {};
    let total = 0;
    let supervisorFeedback = "";
    let gradedAt: string | null = null;

    try {
      const parsed = JSON.parse(p.feedback ?? "");
      rubric = parsed.rubric ?? {};
      total = parsed.total ?? 0;
      supervisorFeedback = parsed.supervisorFeedback ?? "";
      gradedAt = parsed.gradedAt ?? null;
    } catch {
      /* feedback is not JSON — skip */
    }

    return {
      id: p.id,
      projectId: p.id,
      projectTitle: p.title,
      studentName: p.owner?.name ?? "Unknown",
      score: total,
      grade: scoreToGrade(total),
      status: p.status,
      rubricDetail: rubric,
      supervisorFeedback,
      gradedAt,
    };
  });

  res.status(200).json({ status: "success", count: grades.length, data: grades });
});

// Post text feedback from supervisor on a project
export const postProjectFeedback = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const { message } = req.body as { message: string };

  if (!message?.trim()) throw new BadRequestError("Feedback message is required");

  const project = await prisma.project.findUnique({
    where: { id },
    select: { supervisorId: true, ownerId: true },
  });

  if (!project) throw new NotFoundError("Project");

  const isSupervisor = project.supervisorId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isSupervisor && !isAdmin) throw new ForbiddenError();

  await logActivity({
    type: "SUPERVISOR_FEEDBACK",
    payload: { message: message.trim() },
    userId: req.user!.id,
    projectId: id,
  });

  res.status(201).json({ status: "success", message: "Feedback posted" });
});