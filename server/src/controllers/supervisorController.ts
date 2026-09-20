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

export const getAllSupervisors = catchAsync(async (_req: Request, res: Response) => {
  const supervisors = await prisma.user.findMany({
    where: { role: "SUPERVISOR" },
    select: { id: true, name: true, email: true, department: true },
    orderBy: { name: "asc" },
  });
  res.status(200).json({
    status: "success",
    count: supervisors.length,
    data: supervisors,
  });
});

export const getSupervisorDashboard = catchAsync(async (req: Request, res: Response) => {
  const supervisorId = req.user!.id;

  const [totalProjects, pendingMilestones, recentActivity] = await Promise.all([
    prisma.project.count({ where: { supervisorId, isActive: true } }),
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
});

export const getAssignedProjects = catchAsync(async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { supervisorId: req.user!.id, isActive: true },
    include: {
      owner: { select: { id: true, name: true, email: true, department: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      milestones: {
        where: { isActive: true },
        select: { id: true, title: true, status: true, dueDate: true },
      },
      evaluation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = projects.map((p) => {
    const total = p.milestones.length;
    const approved = p.milestones.filter((m) => m.status === "APPROVED").length;
    const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
    return {
      ...p,
      progress,
      team: [p.owner, ...p.members.map((m) => m.user)],
      grade: p.evaluation?.letterGrade || (p.feedback?.includes("A+") ? "A+" : p.feedback?.includes("A") ? "A" : undefined),
    };
  });

  res.status(200).json({
    status: "success",
    count: enriched.length,
    data: enriched,
  });
});

export const getPendingMilestones = catchAsync(async (req: Request, res: Response) => {
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
          owner: { select: { id: true, name: true, email: true } },
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
    note: m.studentNotes || "Deliverables uploaded for evaluation",
    files: Array.isArray(m.attachments) ? m.attachments.length : 1,
    createdAt: m.submittedAt ?? m.createdAt,
    urgent: false,
  }));

  res.status(200).json({
    status: "success",
    count: formatted.length,
    data: formatted,
  });
});

export const reviewMilestone = catchAsync(async (req: Request, res: Response) => {
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
});

export const getSupervisorActivityFeed = catchAsync(async (req: Request, res: Response) => {
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
});

function scoreToGrade(total: number): string {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B+";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  return "Fail";
}

export const evaluateProjectRubric = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const {
    letterGrade,
    score,
    codeQuality,
    documentation,
    presentation,
    innovation,
    teamwork,
    feedback,
  } = req.body;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, supervisorId: true },
  });

  if (!project) throw new NotFoundError("Project");

  const isAdmin = req.user!.role === "ADMIN";
  const isSupervisor = project.supervisorId === req.user!.id;
  if (!isAdmin && !isSupervisor) {
    throw new ForbiddenError("Only the assigned supervisor or an administrator can evaluate this project");
  }

  const totalScore = typeof score === "number" ? score : 85;
  const grade = letterGrade || scoreToGrade(totalScore);

  const evaluation = await prisma.rubricEvaluation.upsert({
    where: { projectId: id },
    create: {
      projectId: id,
      totalScore,
      letterGrade: grade,
      codeQuality: codeQuality || 0,
      documentation: documentation || 0,
      presentation: presentation || 0,
      innovation: innovation || 0,
      teamwork: teamwork || 0,
      feedback: feedback || "Approved with distinction.",
      evaluatorId: req.user!.id,
    },
    update: {
      totalScore,
      letterGrade: grade,
      codeQuality: codeQuality || 0,
      documentation: documentation || 0,
      presentation: presentation || 0,
      innovation: innovation || 0,
      teamwork: teamwork || 0,
      feedback: feedback || "Approved with distinction.",
      evaluatorId: req.user!.id,
    },
  });

  await prisma.project.update({
    where: { id },
    data: {
      status: "APPROVED",
      feedback: feedback || `Graded ${grade}: Approved by supervisor.`,
    },
  });

  await logActivity({
    type: "PROJECT_GRADED",
    payload: { grade, totalScore, feedback },
    userId: req.user!.id,
    projectId: id,
  });

  res.status(200).json({ status: "success", data: evaluation });
});

export const getSuperviorGrades = catchAsync(async (req: Request, res: Response) => {
  const evaluations = await prisma.rubricEvaluation.findMany({
    where: { evaluatorId: req.user!.id },
    include: {
      project: {
        include: {
          owner: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const grades = evaluations.map((e) => ({
    id: e.id,
    projectId: e.projectId,
    projectTitle: e.project.title,
    studentName: e.project.owner?.name ?? "Student",
    score: e.totalScore,
    grade: e.letterGrade,
    status: e.project.status,
    codeQuality: e.codeQuality,
    documentation: e.documentation,
    presentation: e.presentation,
    innovation: e.innovation,
    teamwork: e.teamwork,
    supervisorFeedback: e.feedback,
    gradedAt: e.updatedAt.toISOString().slice(0, 10),
  }));

  res.status(200).json({ status: "success", count: grades.length, data: grades });
});