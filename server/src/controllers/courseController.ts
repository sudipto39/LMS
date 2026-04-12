// src/controllers/courseController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";
import { requireParam } from "../utils/requireParam.js";

// export const createCourse = catchAsync(
//   async (req: Request, res: Response) => {
//     const { title, description } = req.body as {
//       title: string;
//       description?: string;
//     };
//     if (!title) throw new BadRequestError("Course title is required");

//     const course = await prisma.course.create({
//       data: { title, description },
//     });
//     res.status(201).json({ status: "success", data: course });
//   }
// );
export const createCourse = catchAsync(
  async (req: Request, res: Response) => {
    const { title, description } = req.body as {
      title: string;
      description?: string;
    };
    if (!title) throw new BadRequestError("Course title is required");

    const course = await prisma.course.create({
      data: {
        title,
        ...(description !== undefined && { description }),
      },
    });
    res.status(201).json({ status: "success", data: course });
  }
);

export const getAllCourses = catchAsync(
  async (_req: Request, res: Response) => {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
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
    const { title, description } = req.body as {
      title?: string;
      description?: string;
    };
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
    });
    res.status(200).json({ status: "success", data: course });
  }
);

export const deleteCourse = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    await prisma.course.delete({ where: { id } });
    res.status(200).json({
      status: "success",
      message: "Course deleted successfully",
    });
  }
);