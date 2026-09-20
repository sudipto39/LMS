import type { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import dns from "dns/promises";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";
import { logActivity } from "../services/activityService.js";
import { emailService } from "../services/sendVerificationEmail.js";
import { formatRepoUrl, deriveProjectStatus } from "../utils/projectHelpers.js";
import { giteaService } from "../services/giteaService.js";
import { revokeRefreshToken } from "../utils/createSendToken.js";
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
        select: { status: true, _count: { select: { milestones: true } } },
      }),
    ]);

    let draft = 0;
    let inProgress = 0;
    let submitted = 0;
    let approved = 0;
    let rejected = 0;
    let archived = 0;

    for (const p of allProjects) {
      const status = deriveProjectStatus(p.status, { total: p._count.milestones });
      if (status === "DRAFT") draft++;
      else if (status === "IN_PROGRESS") inProgress++;
      else if (status === "SUBMITTED") submitted++;
      else if (status === "APPROVED") approved++;
      else if (status === "REJECTED") rejected++;
      else if (status === "ARCHIVED") archived++;
    }

    let giteaHost = "Not configured";
    try {
      giteaHost = new URL(env.GITEA_BASE_URL).hostname;
    } catch {
      // ignore
    }

    let giteaStatus = "offline";
    try {
      const isUp = await giteaService.checkHealth();
      giteaStatus = isUp ? "online" : "offline";
    } catch {
      giteaStatus = "offline";
    }

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
        giteaStatus,
        giteaHost,
      },
    });
  },
);

export const getAllProjectsForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { supervisorId, ownerId } = req.query;

    const page = req.query["page"] ? Math.max(1, Number(req.query["page"])) : undefined;
    const limit = req.query["limit"] ? Math.max(1, Math.min(100, Number(req.query["limit"]))) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const where = {
      ...(supervisorId && { supervisorId: supervisorId as string }),
      ...(ownerId && { ownerId: ownerId as string }),
    };

    const [totalProjects, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        ...(skip !== undefined && { skip }),
        ...(limit !== undefined && { take: limit }),
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              universityId: true,
              giteaUsername: true,
            },
          },
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          batch: {
            select: {
              id: true,
              name: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                },
              },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  universityId: true,
                  department: true,
                  giteaUsername: true,
                },
              },
            },
          },
          milestones: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              dueDate: true,
              status: true,
              order: true,
              feedback: true,
              studentNotes: true,
              submittedAt: true,
              reviewedAt: true,
              attachments: true,
            },
          },
          _count: { select: { milestones: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const projectsWithStatus = projects.map((p) => {
      const total = p.milestones?.length || 0;
      const approved = (p.milestones || []).filter((m) => m.status === "APPROVED").length;
      const membersList = (p.members || []).map((m) => m.user).filter(Boolean);
      const team = p.owner
        ? [p.owner, ...membersList.filter((u) => u && u.id !== p.owner?.id)]
        : membersList;

      return {
        ...p,
        repoUrl: formatRepoUrl(p),
        status: deriveProjectStatus(p.status, { total, approved }),
        progress: total > 0 ? Math.round((approved / total) * 100) : 0,
        team,
        supervisor: p.supervisor?.name || "Unassigned",
      };
    });

    res.status(200).json({
      status: "success",
      count: projectsWithStatus.length,
      ...(page && limit
        ? {
            meta: {
              total: totalProjects,
              page,
              limit,
              totalPages: Math.ceil(totalProjects / limit),
            },
          }
        : {}),
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
      select: { id: true, name: true, role: true, email: true },
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

    if (project.owner?.email) {
      void emailService.sendSupervisorAssignmentNotification({
        to: project.owner.email,
        name: project.owner.name,
        projectTitle: project.title,
        supervisorName: supervisor.name,
        role: "STUDENT",
      });
    }
    if (supervisor.email && project.owner?.name) {
      void emailService.sendSupervisorAssignmentNotification({
        to: supervisor.email,
        name: supervisor.name,
        projectTitle: project.title,
        supervisorName: supervisor.name,
        role: "SUPERVISOR",
      });
    }

    await logActivity({
      type: "SUPERVISOR_ASSIGNED",
      userId: req.user?.id,
      projectId: project.id,
      payload: {
        projectId: project.id,
        projectTitle: project.title,
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
      },
    });

    res.status(200).json({ status: "success", data: project });
  },
);

export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const page = req.query["page"] ? Math.max(1, Number(req.query["page"])) : 1;
  const limit = req.query["limit"] ? Math.max(1, Math.min(200, Number(req.query["limit"]))) : 100;
  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    prisma.activity.count(),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, role: true } },
        project: { select: { title: true } },
      },
    }),
  ]);

  const formatted = logs.map((l) => {
    const payload = (l.payload as any) || {};
    return {
      id: l.id,
      time: l.createdAt.toISOString(),
      user: l.user?.name || "System",
      action: l.type,
      desc: payload.desc || payload.description || payload.detail || payload.msg || payload.message || "System activity recorded",
      projectName: l.project?.title || "",
    };
  });

  res.status(200).json({
    status: "success",
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: formatted,
  });
});

export const getGiteaConfig = catchAsync(
  async (_req: Request, res: Response) => {
    const rawToken = env.GITEA_ADMIN_TOKEN || "";
    const maskedToken = rawToken
      ? `${rawToken.slice(0, 4)}••••••••${rawToken.slice(-4)}`
      : "";
    const giteaUrl = env.GITEA_BASE_URL.replace(/\/api\/v1\/?$/, "");

    res.status(200).json({
      status: "success",
      data: {
        url: giteaUrl,
        baseUrl: env.GITEA_BASE_URL,
        adminToken: maskedToken,
        apiToken: maskedToken,
        webhookSecret: env.GITEA_WEBHOOK_SECRET ? "••••••••" : "",
        orgTemplate: "univ-projects",
      },
    });
  },
);

const isPrivateIp = (ip: string): boolean => {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") return true;
  if (
    ip.startsWith("127.") ||
    ip.startsWith("169.254.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.")
  ) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc00:") || ip.startsWith("fe80:") || ip.startsWith("::ffff:127.")) return true;
  return false;
};

const validateSafeGiteaUrl = async (inputUrl: string): Promise<string> => {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new BadRequestError("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BadRequestError("Only HTTP and HTTPS protocols are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();
  let configuredHost = "";
  try {
    configuredHost = new URL(env.GITEA_BASE_URL).hostname.toLowerCase();
  } catch {
    // ignore
  }

  // If matches configured host, it's allowed
  if (configuredHost && hostname === configuredHost) {
    return parsed.origin;
  }

  // Prevent SSRF: block loopback, RFC1918 private, link-local, cloud metadata
  if (isPrivateIp(hostname) || hostname === "localhost") {
    throw new BadRequestError("Target URL refers to a restricted internal address");
  }

  // Perform DNS resolution to prevent DNS rebinding SSRF
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new BadRequestError("Target URL resolves to a restricted internal IP address");
      }
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    throw new BadRequestError("Unable to resolve target URL hostname");
  }

  return parsed.origin;
};

export const saveGiteaConfig = catchAsync(
  async (req: Request, res: Response) => {
    const { url } = req.body || {};
    let validatedUrl = env.GITEA_BASE_URL;
    if (url) {
      validatedUrl = await validateSafeGiteaUrl(url);
    }

    if (url) {
      try {
        await redis.set("config:gitea_url", validatedUrl);
      } catch {
        // Redis optional fallback
      }
    }

    await logActivity({
      type: "GITEA_CONFIG_SAVED",
      userId: req.user?.id,
      payload: { url: validatedUrl },
    });

    res.status(200).json({
      status: "success",
      message: "Gitea configuration saved successfully",
      data: {
        url: validatedUrl,
        configured: true,
      },
    });
  },
);

export const testGiteaConnection = catchAsync(
  async (req: Request, res: Response) => {
    const { url, token } = req.body || {};
    const defaultUrl = env.GITEA_BASE_URL.replace(/\/api\/v1\/?$/, "");
    const targetUrl = url ? await validateSafeGiteaUrl(url) : defaultUrl;

    // Never leak global system GITEA_ADMIN_TOKEN to external untrusted URLs
    let isConfiguredHost = false;
    try {
      isConfiguredHost =
        new URL(targetUrl).hostname.toLowerCase() ===
        new URL(env.GITEA_BASE_URL).hostname.toLowerCase();
    } catch {
      // ignore
    }

    let authToken = "";
    if (token && !token.includes("••••")) {
      authToken = token;
    } else if (isConfiguredHost) {
      authToken = env.GITEA_ADMIN_TOKEN;
    }

    const startTime = Date.now();
    try {
      const giteaRes = await axios.get(`${targetUrl}/api/v1/version`, {
        headers: authToken ? { Authorization: `token ${authToken}` } : {},
        timeout: 5000,
        maxRedirects: 0, // Prevent redirect-based SSRF into private IP space
      });
      const latencyMs = Date.now() - startTime;
      res.status(200).json({
        status: "success",
        data: {
          connected: true,
          latencyMs,
          version: giteaRes.data?.version || "1.22.x",
        },
      });
    } catch (err: any) {
      try {
        await axios.get(`${targetUrl}/`, {
          timeout: 3000,
          maxRedirects: 0,
        });
        const latencyMs = Date.now() - startTime;
        res.status(200).json({
          status: "success",
          data: {
            connected: true,
            latencyMs,
            version: "Gitea Web",
          },
        });
      } catch (rootErr: any) {
        res.status(200).json({
          status: "success",
          data: {
            connected: false,
            latencyMs: 0,
            error: err?.message || rootErr?.message || "Could not connect to Gitea server",
          },
        });
      }
    }
  },
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, giteaUsername: true } });
    if (!user) throw new NotFoundError("User");

    await revokeRefreshToken(id);

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

    if (user.giteaUsername) {
      await giteaService.deleteUser(user.giteaUsername);
    }

    await logActivity({
      type: "USER_DELETED",
      userId: req.user?.id,
      payload: { deletedUserId: id },
    });

    res.status(200).json({ status: "success", message: "User deleted" });
  },
);

export const createUser = catchAsync(
  async (req: Request, res: Response) => {
    const { name, email, role, department, phoneNumber, universityId, password, batchId } = req.body as {
      name: string;
      email: string;
      role?: "STUDENT" | "SUPERVISOR" | "ADMIN";
      department?: string;
      phoneNumber?: string;
      universityId?: string;
      password?: string;
      batchId?: string;
    };

    if (!name?.trim() || !email?.trim()) {
      throw new BadRequestError("Name and email are required");
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw new BadRequestError("A user with this email address already exists");
    }

    const userRole = role || "STUDENT";
    const defaultPassword = password || `${crypto.randomBytes(12).toString("base64url")}!1`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
    const giteaUsername = `${slug}${Date.now().toString().slice(-4)}`;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: userRole,
        department: department?.trim() || "CSE",
        phoneNumber: phoneNumber?.trim() || null,
        universityId: universityId?.trim() || null,
        giteaUsername,
        isEmailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phoneNumber: true,
        universityId: true,
        giteaUsername: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    let batchName = "General Batch";
    if (batchId && userRole === "STUDENT") {
      try {
        const batch = await prisma.batch.findUnique({ where: { id: batchId } });
        if (batch) {
          batchName = batch.name;
          await prisma.batchEnrollment.create({
            data: {
              userId: user.id,
              batchId,
            },
          });
        }
      } catch {
        // Continue even if enrollment fails
      }
    }

    await logActivity({
      type: "USER_CREATED",
      userId: req.user?.id,
      payload: {
        createdUserId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        ...user,
        dept: user.department,
        idNo: user.universityId || "—",
        batch: userRole === "STUDENT" ? batchName : "Academic Staff",
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || "User")}`,
      },
    });
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

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!user) throw new NotFoundError("User");

    // Validate role against allowed enum values
    const VALID_ROLES = ["STUDENT", "SUPERVISOR", "ADMIN"] as const;
    if (role && !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      throw new BadRequestError("Invalid role value");
    }

    let cleanEmail: string | undefined = undefined;
    if (email) {
      cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new BadRequestError("Invalid email format");
      }
      if (cleanEmail !== user.email) {
        const duplicate = await prisma.user.findFirst({
          where: { email: cleanEmail, id: { not: id } },
          select: { id: true },
        });
        if (duplicate) {
          throw new BadRequestError("Email is already in use by another account");
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(cleanEmail && { email: cleanEmail }),
        ...(role && { role: role as any }),
        ...(department !== undefined && { department }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(universityId !== undefined && { universityId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phoneNumber: true,
        universityId: true,
        giteaUsername: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (role || cleanEmail) {
      await revokeRefreshToken(id);
    }

    await logActivity({
      type: "USER_UPDATED",
      userId: req.user?.id,
      payload: {
        targetUserId: id,
        updatedName: updated.name,
        updatedEmail: updated.email,
        updatedRole: updated.role,
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

    if (users.length > 200) {
      res.status(400).json({ status: "error", message: "Maximum 200 users can be imported per batch" });
      return;
    }

    const results = {
      successCount: 0,
      failed: [] as Array<{ email: string; reason: string }>,
    };

    const candidateEmails = users
      .map((u) => u.email?.trim().toLowerCase())
      .filter(Boolean) as string[];
    const candidateUnivIds = users
      .map((u) => u.universityId?.trim())
      .filter(Boolean) as string[];

    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: candidateEmails } },
          ...(candidateUnivIds.length > 0 ? [{ universityId: { in: candidateUnivIds } }] : []),
        ],
      },
      select: { email: true, universityId: true },
    });

    const existingEmailSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingIdSet = new Set(existingUsers.map((u) => u.universityId).filter(Boolean));

    const VALID_IMPORT_ROLES = ["STUDENT", "SUPERVISOR"];

    for (const u of users) {
      if (!u.name || !u.email) {
        results.failed.push({ email: u.email || "unknown", reason: "Name and email are required" });
        continue;
      }

      const email = u.email.trim().toLowerCase();
      const universityId = u.universityId?.trim();

      if (existingEmailSet.has(email) || (universityId && existingIdSet.has(universityId))) {
        results.failed.push({ email, reason: "Email or University ID already exists" });
        continue;
      }

      const resolvedRole = (u.role || "STUDENT").toUpperCase();
      if (!VALID_IMPORT_ROLES.includes(resolvedRole)) {
        results.failed.push({ email, reason: `Invalid role '${u.role}'. Allowed: STUDENT, SUPERVISOR` });
        continue;
      }

      try {
        const defaultPassword = `${crypto.randomBytes(10).toString("base64url")}!1`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        const slug = u.name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
        const giteaUsername = `${slug}${Date.now().toString().slice(-4)}`;

        await prisma.user.create({
          data: {
            name: u.name.trim(),
            email,
            password: hashedPassword,
            role: resolvedRole as any,
            department: u.department || null,
            universityId: universityId || null,
            phoneNumber: u.phoneNumber || null,
            giteaUsername,
          },
        });

        existingEmailSet.add(email);
        if (universityId) existingIdSet.add(universityId);
        results.successCount++;

        // Yield execution every 5 users to allow Node event loop to process concurrent I/O
        if (results.successCount % 5 === 0) {
          await new Promise((r) => setImmediate(r));
        }
      } catch (err: any) {
        results.failed.push({ email, reason: err.message || "Failed to create user" });
      }
    }

    if (results.successCount > 0) {
      await logActivity({
        type: "USERS_IMPORTED",
        userId: req.user?.id,
        payload: {
          successCount: results.successCount,
          failedCount: results.failed.length,
        },
      });
    }

    res.status(200).json({ status: "success", data: results });
  },
);

// ── Supervisor Allocation Requests Queue ──────────────────────────────────────
export const getSupervisorRequests = catchAsync(
  async (_req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
      where: {
        supervisorRequestStatus: "PENDING",
        supervisorId: null,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            universityId: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
            course: { select: { id: true, title: true } },
          },
        },
        problemStatement: {
          select: {
            id: true,
            title: true,
            domain: true,
            creator: { select: { id: true, name: true, email: true } },
          },
        },
        requestedSupervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    // Compute current active load for requested supervisors in a single query
    const supervisorIds = [...new Set(projects.map((p) => p.requestedSupervisorId).filter(Boolean))] as string[];

    const loadCounts = supervisorIds.length > 0
      ? await prisma.project.groupBy({
          by: ["supervisorId"],
          where: {
            supervisorId: { in: supervisorIds },
            isActive: true,
            status: { not: "ARCHIVED" },
          },
          _count: { _all: true },
        })
      : [];

    const loadMap = new Map<string, number>();
    for (const item of loadCounts) {
      if (item.supervisorId) {
        loadMap.set(item.supervisorId, item._count._all);
      }
    }

    const requestsWithLoad = projects.map((p) => ({
      ...p,
      supervisorActiveCount: (p.requestedSupervisorId && loadMap.get(p.requestedSupervisorId)) || 0,
    }));

    res.status(200).json({
      status: "success",
      count: requestsWithLoad.length,
      data: requestsWithLoad,
    });
  }
);

// ── Admin Review & Approve/Reassign Supervisor Request ───────────────────────
export const reviewSupervisorRequest = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = requireParam(req.params["id"], "id");
    const { status, assignedSupervisorId, adminNote } = req.body as {
      status: "APPROVED" | "REJECTED";
      assignedSupervisorId?: string;
      adminNote?: string;
    };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      throw new NotFoundError("Project");
    }

    if (status === "APPROVED") {
      const targetSupervisorId = assignedSupervisorId || project.requestedSupervisorId;

      if (!targetSupervisorId) {
        throw new BadRequestError("No supervisor specified to approve or assign.");
      }

      const supervisor = await prisma.user.findUnique({
        where: { id: targetSupervisorId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!supervisor || supervisor.role !== "SUPERVISOR") {
        throw new NotFoundError("Faculty Supervisor");
      }

      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          supervisorId: targetSupervisorId,
          supervisorRequestStatus: "APPROVED",
          feedback: adminNote ? `Admin Note: ${adminNote}` : project.feedback,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          supervisor: { select: { id: true, name: true, email: true, department: true } },
          problemStatement: { select: { id: true, title: true } },
        },
      });

      await logActivity({
        type: "SUPERVISOR_ASSIGNED",
        userId: req.user!.id,
        projectId: project.id,
        payload: {
          projectId: project.id,
          projectTitle: project.title,
          supervisorId: supervisor.id,
          supervisorName: supervisor.name,
          studentName: project.owner.name,
          adminNote,
        },
      });

      // Send email notifications
      if (project.owner?.email) {
        void emailService.sendSupervisorAssignmentNotification({
          to: project.owner.email,
          name: project.owner.name,
          projectTitle: project.title,
          supervisorName: supervisor.name,
          role: "STUDENT",
        });
      }
      if (supervisor.email && project.owner?.name) {
        void emailService.sendSupervisorAssignmentNotification({
          to: supervisor.email,
          name: supervisor.name,
          projectTitle: project.title,
          supervisorName: supervisor.name,
          role: "SUPERVISOR",
        });
      }

      res.status(200).json({ status: "success", data: updated });
      return;
    }

    // Status is REJECTED
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        supervisorId: null,
        supervisorRequestStatus: "REJECTED",
        feedback: adminNote ? `Supervisor request declined: ${adminNote}` : "Supervisor request declined by administrator.",
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        problemStatement: { select: { id: true, title: true } },
      },
    });

    await logActivity({
      type: "SUPERVISOR_REQUEST_DECLINED",
      userId: req.user!.id,
      projectId: project.id,
      payload: {
        projectId: project.id,
        projectTitle: project.title,
        studentName: project.owner.name,
        adminNote,
      },
    });

    res.status(200).json({ status: "success", data: updated });
  }
);

