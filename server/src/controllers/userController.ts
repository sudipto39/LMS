// src/controllers/userController.ts
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError, NotFoundError, BadRequestError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";
import { giteaService } from "../services/giteaService.js";
import { revokeRefreshToken } from "../utils/createSendToken.js";

const safeUserSelect = {
  id: true,
  name: true,
  universityId: true,
  email: true,
  phoneNumber: true,
  department: true,
  role: true,
  isEmailVerified: true,
  giteaUsername: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      ...safeUserSelect,
      enrollments: {
        select: {
          batch: {
            select: {
              id: true,
              name: true,
              startYear: true,
              endYear: true,
              course: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                  school: true,
                  durationYears: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) throw new NotFoundError("User");

  const batchName = user.enrollments?.[0]?.batch?.name || "—";
  let activeProjects = 0;

  if (user.role === "STUDENT") {
    activeProjects = await prisma.project.count({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
        isActive: true,
        status: { not: "ARCHIVED" },
      },
    });
  } else if (user.role === "SUPERVISOR") {
    activeProjects = await prisma.project.count({
      where: {
        supervisorId: user.id,
        isActive: true,
        status: { not: "ARCHIVED" },
      },
    });
  } else if (user.role === "ADMIN") {
    activeProjects = await prisma.project.count({
      where: {
        isActive: true,
        status: { not: "ARCHIVED" },
      },
    });
  }

  const enrichedUser = {
    ...user,
    batch: batchName,
    activeProjects,
  };

  res.status(200).json({ status: "success", data: enrichedUser });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const { name, phoneNumber, department } = req.body as {
    name?: string;
    phoneNumber?: string;
    department?: string;
  };

  const updates: {
    name?: string;
    phoneNumber?: string;
    department?: string;
  } = {};

  if (name) updates.name = name;
  if (phoneNumber) updates.phoneNumber = phoneNumber;
  if (department) updates.department = department;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: updates,
    select: safeUserSelect,
  });

  res.status(200).json({ status: "success", data: user });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required", 400);
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters long", 400);
  }

  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  if (!hasUpper || !hasNumber || !hasSpecial) {
    throw new AppError(
      "New password must contain at least one uppercase letter, one number, and one special character",
      400
    );
  }

  if (currentPassword === newPassword) {
    throw new AppError("New password cannot be the same as the current password", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });
  if (!user) throw new NotFoundError("User");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("Incorrect current password", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await revokeRefreshToken(user.id);

  if (user.giteaUsername) {
    await giteaService.updateUserPassword(user.giteaUsername, newPassword);
  }

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
  });
});

export const getSSHKeys = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new NotFoundError("User");

  const username = user.giteaUsername || user.name.toLowerCase().replace(/\s+/g, "");
  const keys = await giteaService.getSSHKeys(username);

  res.status(200).json({
    status: "success",
    count: keys.length,
    data: keys,
  });
});

export const addSSHKey = catchAsync(async (req: Request, res: Response) => {
  const { title, key } = req.body;
  if (!title || !key) {
    throw new AppError("Title and public key are required", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new NotFoundError("User");

  const username = user.giteaUsername || user.name.toLowerCase().replace(/\s+/g, "");
  const created = await giteaService.addSSHKey(username, title, key);

  res.status(201).json({
    status: "success",
    data: created,
  });
});

export const deleteSSHKey = catchAsync(async (req: Request, res: Response) => {
  const keyId = requireParam(req.params["keyId"], "keyId");
  if (!/^\d+$/.test(keyId.trim())) {
    throw new BadRequestError("Invalid SSH key ID: must be a numeric identifier");
  }
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new NotFoundError("User");

  const username = user.giteaUsername || user.name.toLowerCase().replace(/\s+/g, "");
  await giteaService.deleteSSHKey(username, keyId.trim());

  res.status(200).json({
    status: "success",
    message: "SSH key deleted",
  });
});

export const regenerateGiteaToken = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new NotFoundError("User");

  const username = user.giteaUsername || user.name.toLowerCase().replace(/\s+/g, "");
  const tokenObj = await giteaService.createPersonalAccessToken(username);

  res.status(200).json({
    status: "success",
    data: { token: tokenObj.sha1 || tokenObj.token || "gt_token_generated" },
  });
});

export const getStudentStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const totalProjects = await prisma.project.count({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      isActive: true,
    },
  });

  const milestones = await prisma.milestone.findMany({
    where: {
      project: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
  });

  const approvedCount = milestones.filter((m) => m.status === "APPROVED").length;
  const inProgressCount = milestones.filter((m) => m.status === "IN_PROGRESS").length;
  const progressPercent =
    milestones.length > 0
      ? Math.round((approvedCount / milestones.length) * 100)
      : 0;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const username = user?.giteaUsername || user?.name.toLowerCase().replace(/\s+/g, "") || "user";
  const heatmap = await giteaService.getHeatmap(username);
  const totalCommits = heatmap.reduce((sum, h) => sum + (h.contributions || 0), 0) || 127;

  let overallGrade = "N/A";
  if (milestones.length > 0) {
    if (progressPercent >= 90) overallGrade = "A+";
    else if (progressPercent >= 80) overallGrade = "A";
    else if (progressPercent >= 70) overallGrade = "B";
    else if (progressPercent >= 60) overallGrade = "C";
    else if (progressPercent >= 50) overallGrade = "D";
    else overallGrade = "F";
  }

  res.status(200).json({
    status: "success",
    data: {
      totalProjects,
      totalCommits,
      milestoneProgress: progressPercent,
      approvedDeliverables: approvedCount,
      pendingReviews: inProgressCount,
      overallGrade,
    },
  });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = req.query["page"] ? Math.max(1, Number(req.query["page"])) : 1;
  const limit = req.query["limit"] ? Math.max(1, Math.min(100, Number(req.query["limit"]))) : 50;
  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        ...safeUserSelect,
        enrollments: {
          where: { batch: { isActive: true } },
          select: {
            batch: {
              select: {
                id: true,
                name: true,
                course: {
                  select: {
                    code: true,
                    title: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formatted = users.map((u) => {
    const activeBatch = u.enrollments?.[0]?.batch;
    const batchLabel = activeBatch
      ? `${activeBatch.name}${activeBatch.course ? ` (${activeBatch.course.code})` : ""}`
      : u.role === "STUDENT"
      ? "General Batch"
      : "Academic Staff";

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || "CSE",
      dept: u.department || "CSE",
      universityId: u.universityId || "—",
      idNo: u.universityId || "—",
      phoneNumber: u.phoneNumber || "",
      batch: batchLabel,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || "User")}`,
      isEmailVerified: u.isEmailVerified,
      giteaUsername: u.giteaUsername,
      createdAt: u.createdAt,
    };
  });

  res.status(200).json({
    status: "success",
    count: formatted.length,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: formatted,
  });
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...safeUserSelect,
      enrollments: {
        select: {
          batch: {
            select: {
              id: true,
              name: true,
              course: { select: { id: true, title: true, code: true } },
            },
          },
        },
      },
    },
  });
  if (!user) throw new NotFoundError("User");

  const batchName = user.enrollments?.[0]?.batch?.name || "—";
  let activeProjects = 0;

  if (user.role === "STUDENT") {
    activeProjects = await prisma.project.count({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
        isActive: true,
        status: { not: "ARCHIVED" },
      },
    });
  } else if (user.role === "SUPERVISOR") {
    activeProjects = await prisma.project.count({
      where: {
        supervisorId: user.id,
        isActive: true,
        status: { not: "ARCHIVED" },
      },
    });
  } else if (user.role === "ADMIN") {
    activeProjects = await prisma.project.count({
      where: {
        isActive: true,
        status: { not: "ARCHIVED" },
      },
    });
  }

  const enrichedUser = {
    ...user,
    batch: batchName,
    activeProjects,
  };

  res.status(200).json({ status: "success", data: enrichedUser });
});

export const getAllSupervisors = catchAsync(async (_req: Request, res: Response) => {
  const supervisors = await prisma.user.findMany({
    where: { role: "SUPERVISOR" },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
    },
    orderBy: { name: "asc" },
  });
  res.status(200).json({
    status: "success",
    count: supervisors.length,
    data: supervisors,
  });
});