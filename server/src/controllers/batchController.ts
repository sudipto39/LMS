// src/controllers/batchController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";

// Get all active courses — used in registration dropdown
export const getCoursesForRegistration = catchAsync(
  async (_req: Request, res: Response) => {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        code: true,
        school: true,
        durationYears: true,
      },
      orderBy: { title: "asc" },
    });

    res.status(200).json({
      status: "success",
      count: courses.length,
      data: courses,
    });
  }
);

// Get batches for a specific course — used in registration dropdown
export const getBatchesByCourse = catchAsync(
  async (req: Request, res: Response) => {
    const courseId = requireParam(req.params["courseId"], "courseId");

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) throw new NotFoundError("Course");

    const batches = await prisma.batch.findMany({
      where: {
        courseId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        startYear: true,
        endYear: true,
      },
      orderBy: { startYear: "desc" },
    });

    res.status(200).json({
      status: "success",
      count: batches.length,
      data: batches,
    });
  }
);

// Admin — create batch
export const createBatch = catchAsync(
  async (req: Request, res: Response) => {
    const { name, courseId, startYear, endYear } = req.body as {
      name: string;
      courseId: string;
      startYear: number;
      endYear: number;
    };

    if (!name) throw new BadRequestError("Batch name is required");
    if (!courseId) throw new BadRequestError("Course ID is required");
    if (!startYear || !endYear) {
      throw new BadRequestError("Start year and end year are required");
    }

    const currentYear = new Date().getFullYear();
    if (startYear < 1900 || endYear > currentYear + 10) {
      throw new BadRequestError("Years must be between 1900 and " + (currentYear + 10));
    }
    if (startYear > endYear) {
      throw new BadRequestError("Start year must be before or equal to end year");
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) throw new NotFoundError("Course");

    const batch = await prisma.batch.create({
      data: {
        name,
        courseId,
        startYear,
        endYear,
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    });

    res.status(201).json({ status: "success", data: batch });
  }
);

// Admin — get all batches
export const getAllBatches = catchAsync(
  async (_req: Request, res: Response) => {
    const batches = await prisma.batch.findMany({
      where: { isActive: true },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
        _count: {
          select: { enrollments: true, projects: true },
        },
      },
      orderBy: { startYear: "desc" },
    });

    res.status(200).json({
      status: "success",
      count: batches.length,
      data: batches,
    });
  }
);

// Admin — delete batch (soft)
export const deleteBatch = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    await prisma.batch.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      status: "success",
      message: "Batch deleted successfully",
    });
  }
);

// Admin — get students enrolled in batch
export const getBatchStudents = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");

  const enrollments = await prisma.batchEnrollment.findMany({
    where: { batchId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          universityId: true,
          department: true,
          role: true,
          isEmailVerified: true,
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const students = enrollments.map((e) => e.user);

  res.status(200).json({
    status: "success",
    count: students.length,
    data: students,
  });
});

// Admin — enroll student in batch
export const enrollStudentInBatch = catchAsync(async (req: Request, res: Response) => {
  const batchId = requireParam(req.params["id"], "id");
  const { userId } = req.body as { userId: string };

  if (!userId) throw new BadRequestError("User ID is required");

  const enrollment = await prisma.batchEnrollment.upsert({
    where: {
      userId_batchId: { userId, batchId },
    },
    create: { userId, batchId },
    update: {},
    include: {
      user: {
        select: { id: true, name: true, email: true, universityId: true },
      },
    },
  });

  res.status(201).json({ status: "success", data: enrollment });
});

// Admin — remove student from batch
export const removeStudentFromBatch = catchAsync(async (req: Request, res: Response) => {
  const batchId = requireParam(req.params["id"], "id");
  const userId = requireParam(req.params["userId"], "userId");

  await prisma.batchEnrollment.delete({
    where: {
      userId_batchId: { userId, batchId },
    },
  });

  res.status(200).json({
    status: "success",
    message: "Student removed from batch enrollment",
  });
});