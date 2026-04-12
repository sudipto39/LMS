// src/controllers/courseController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";

export const createCourse = catchAsync(
  async (req: Request, res: Response) => {
    const { title, code, school, durationYears, description } = req.body as {
      title: string;
      code?: string;
      school?: string;
      durationYears?: number;
      description?: string;
    };

    if (!title) throw new BadRequestError("Course title is required");

    const course = await prisma.course.create({
      data: {
        title,
        ...(code !== undefined && { code }),
        ...(school !== undefined && { school }),
        ...(durationYears !== undefined && { durationYears }),
        ...(description !== undefined && { description }),
      },
    });

    res.status(201).json({ status: "success", data: course });
  }
);

export const getAllCourses = catchAsync(
  async (_req: Request, res: Response) => {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        code: true,
        school: true,
        durationYears: true,
        description: true,
        createdAt: true,
        _count: { select: { batches: true } },
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

export const getCourseById = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const course = await prisma.course.findUnique({
      where: { id },
      include: { batches: true },
    });

    if (!course) throw new NotFoundError("Course");
    res.status(200).json({ status: "success", data: course });
  }
);

export const updateCourse = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { title, code, school, durationYears, description, isActive } =
      req.body as {
        title?: string;
        code?: string;
        school?: string;
        durationYears?: number;
        description?: string;
        isActive?: boolean;
      };

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(code !== undefined && { code }),
        ...(school !== undefined && { school }),
        ...(durationYears !== undefined && { durationYears }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({ status: "success", data: course });
  }
);

export const deleteCourse = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    // Soft delete
    await prisma.course.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      status: "success",
      message: "Course deleted successfully",
    });
  }
);