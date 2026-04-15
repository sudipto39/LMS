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