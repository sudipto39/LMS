import { Request, Response, RequestHandler } from "express";
import Course from "../models/courseModel.js";
import catchAsync from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

export const createCourse: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { name, code, school, durationYears } = req.body;

    const existing = await Course.findOne({ code });

    if (existing) {
      throw new AppError("Course with this code already exists", 400);
    }

    const course = await Course.create({
      name,
      code,
      school,
      durationYears,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  },
);

export const getAllCourses: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { page = "1", limit = "20" } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const courses = await Course.find({ isActive: true })
      .select("_id name code school")
      .sort({ name: 1 })
      .lean();

    const total = await Course.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      page: pageNum,
      data: courses,
    });
  },
);

export const getCourseById: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError("Invalid course id", 400);
    }

    const course = await Course.findById(id).lean();

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  },
);

export const updateCourse: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError("Invalid course id", 400);
    }

    const course = await Course.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  },
);

export const deleteCourse: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError("Invalid course id", 400);
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  },
);
