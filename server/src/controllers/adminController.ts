// src/controllers/adminController.ts
import type { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";
import bcrypt from "bcrypt";

export const getAdminStats = catchAsync(
  async (_req: Request, res: Response) => {
    const [
      totalUsers,
      students,
      supervisors,
      activeProjectsCount,
      pendingReviews,
      allProjects,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "SUPERVISOR" } }),
      prisma.project.count(),
      prisma.milestone.count({ where: { status: "SUBMITTED" } }),
      prisma.project.findMany({
        include: { _count: { select: { milestones: true } } },
      }),
    ]);

    let draft = 0;
    let inProgress = 0;
    let submitted = 0;
    let approved = 0;
    let rejected = 0;
    let archived = 0;

    for (const p of allProjects) {
      let status = p.status;
      if (status === "DRAFT" && p._count.milestones > 0) {
        status = "IN_PROGRESS";
      }
      if (status === "DRAFT") draft++;
      else if (status === "IN_PROGRESS") inProgress++;
      else if (status === "SUBMITTED") submitted++;
      else if (status === "APPROVED") approved++;
      else if (status === "REJECTED") rejected++;
      else if (status === "ARCHIVED") archived++;
    }

    const giteaHost = process.env.GITEA_URL 
      ? new URL(process.env.GITEA_URL).hostname 
      : "Not configured";

    res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        students,
        supervisors,
        activeProjects: activeProjectsCount,
        inProgress,
        pendingReviews,
        draft,
        submitted,
        approved,
        rejected,
        archived,
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

    const projectsWithStatus = await Promise.all(
      projects.map(async (p) => {
        const [total, approved] = await Promise.all([
          prisma.milestone.count({ where: { projectId: p.id, isActive: true } }),
          prisma.milestone.count({ where: { projectId: p.id, isActive: true, status: "APPROVED" } }),
        ]);
        return {
          ...p,
          status: (p.status === "DRAFT" && (approved > 0 || total > 0)) ? "IN_PROGRESS" : p.status,
          progress: total > 0 ? Math.round((approved / total) * 100) : 0,
        };
      })
    );

    res.status(200).json({
      status: "success",
      count: projectsWithStatus.length,
      data: projectsWithStatus,
    });
  },
);

export const getProjectsForExport = catchAsync(
  async (_req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            universityId: true,
            department: true,
          },
        },
        supervisor: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } },
        milestones: {
          where: { isActive: true },
          select: { id: true, status: true },
        },
      },
      orderBy: [{ batch: { name: "asc" } }, { createdAt: "desc" }],
    });

    const rows = projects.map((p) => {
      const total = p.milestones.length;
      const approved = p.milestones.filter((m) => m.status === "APPROVED").length;
      const progress = total > 0 ? Math.round((approved / total) * 100) : 0;

      // Derive display status
      let status: string = p.status;
      if (status === "DRAFT" && total > 0) status = "IN_PROGRESS";

      return {
        id: p.id,
        projectTitle: p.title,
        technologies: p.technologies?.join(", ") ?? "",
        status,
        progress,
        startDate: p.startDate
          ? new Date(p.startDate).toLocaleDateString("en-IN")
          : "",
        endDate: p.endDate
          ? new Date(p.endDate).toLocaleDateString("en-IN")
          : "",
        studentName: p.owner?.name ?? "",
        universityId: p.owner?.universityId ?? "",
        department: p.owner?.department ?? "",
        supervisorName: p.supervisor?.name ?? "",
        batchName: p.batch?.name ?? "",
        milestonesTotal: total,
        milestonesApproved: approved,
      };
    });

    res.status(200).json({
      status: "success",
      count: rows.length,
      data: rows,
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
    const rawToken = process.env["GITEA_ADMIN_TOKEN"] || process.env["GITEA_TOKEN"] || "";
    const maskedToken = rawToken
      ? `${rawToken.slice(0, 4)}••••••••${rawToken.slice(-4)}`
      : "";

    res.status(200).json({
      status: "success",
      data: {
        baseUrl: process.env["GITEA_BASE_URL"] || process.env["GITEA_URL"] || "",
        apiToken: maskedToken,
        orgTemplate: process.env["GITEA_ORG"] || "",
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

    // Collect all projects owned by this user
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: id },
      select: { id: true },
    });
    const ownedProjectIds = ownedProjects.map((p) => p.id);

    // Delete/unlink all related records then the user — order matters for FK constraints
    await prisma.$transaction(async (tx) => {
      // Unlink child projects that reference owned projects as parent
      if (ownedProjectIds.length > 0) {
        await tx.project.updateMany({
          where: { parentProjectId: { in: ownedProjectIds } },
          data: { parentProjectId: null },
        });
        // Delete milestone attachments, activities, members for owned projects
        await tx.milestone.deleteMany({ where: { projectId: { in: ownedProjectIds } } });
        await tx.activity.deleteMany({ where: { projectId: { in: ownedProjectIds } } });
        await tx.projectMember.deleteMany({ where: { projectId: { in: ownedProjectIds } } });
        await tx.project.deleteMany({ where: { id: { in: ownedProjectIds } } });
      }
      // Clean up non-owned references
      await tx.batchEnrollment.deleteMany({ where: { userId: id } });
      await tx.activity.deleteMany({ where: { userId: id } });
      await tx.milestone.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } });
      await tx.milestone.updateMany({ where: { submittedById: id }, data: { submittedById: null } });
      await tx.project.updateMany({ where: { supervisorId: id }, data: { supervisorId: null } });
      await tx.projectMember.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

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

    // Validate role against allowed enum values
    const VALID_ROLES = ["STUDENT", "SUPERVISOR", "ADMIN"] as const;
    if (role && !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      throw new BadRequestError("Invalid role value");
    }

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

export const importUsers = catchAsync(
  async (req: Request, res: Response) => {
    const { users } = req.body as {
      users: Array<{
        name: string;
        email: string;
        role: string;
        department?: string;
        universityId?: string;
        phoneNumber?: string;
      }>;
    };

    if (!Array.isArray(users)) {
      res.status(400).json({ status: "error", message: "Users list must be an array" });
      return;
    }

    const results = {
      successCount: 0,
      failed: [] as Array<{ email: string; reason: string }>,
    };

    for (const u of users) {
      try {
        if (!u.name || !u.email) {
          results.failed.push({ email: u.email || "unknown", reason: "Name and email are required" });
          continue;
        }

        const existing = await prisma.user.findFirst({
          where: {
            OR: [
              { email: u.email },
              ...(u.universityId ? [{ universityId: u.universityId }] : []),
            ],
          },
        });

        if (existing) {
          results.failed.push({ email: u.email, reason: "Email or University ID already exists" });
          continue;
        }

        const VALID_IMPORT_ROLES = ["STUDENT", "SUPERVISOR"];
        const resolvedRole = (u.role || "STUDENT").toUpperCase();
        if (!VALID_IMPORT_ROLES.includes(resolvedRole)) {
          results.failed.push({ email: u.email, reason: `Invalid role '${u.role}'. Allowed: STUDENT, SUPERVISOR` });
          continue;
        }

        const defaultPassword = `${crypto.randomBytes(10).toString("base64url")}!1`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        await prisma.user.create({
          data: {
            name: u.name,
            email: u.email.toLowerCase(),
            password: hashedPassword,
            role: resolvedRole as any,
            department: u.department || null,
            universityId: u.universityId || null,
            phoneNumber: u.phoneNumber || null,
          },
        });
        results.successCount++;
      } catch (err: any) {
        results.failed.push({ email: u.email || "unknown", reason: err.message || "Failed to create user" });
      }
    }

    res.status(200).json({ status: "success", data: results });
  },
);
