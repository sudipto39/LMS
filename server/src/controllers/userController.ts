// src/controllers/userController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";

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
  res.status(200).json({ status: "success", data: user });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const { name, giteaUsername, phoneNumber, department } = req.body as {
    name?: string;
    giteaUsername?: string;
    phoneNumber?: string;
    department?: string;
  };

  const updates: {
    name?: string;
    giteaUsername?: string;
    phoneNumber?: string;
    department?: string;
  } = {};

  if (name) updates.name = name;
  if (giteaUsername) updates.giteaUsername = giteaUsername;
  if (phoneNumber) updates.phoneNumber = phoneNumber;
  if (department) updates.department = department;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: updates,
    select: safeUserSelect,
  });

  res.status(200).json({ status: "success", data: user });
});

export const getAllUsers = catchAsync(
  async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      status: "success",
      count: users.length,
      data: users,
    });
  }
);

export const getUserById = catchAsync(
  async (req: Request, res: Response) => {
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
    res.status(200).json({ status: "success", data: user });
  }
);

export const getAllSupervisors = catchAsync(
  async (_req: Request, res: Response) => {
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
  }
);