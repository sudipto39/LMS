// src/controllers/courseEvaluationController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { Prisma } from "../generated/prisma/index.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";
import { logActivity } from "../services/activityService.js";

interface ExperimentInput {
  exp: number;
  notebook: number;
  performance: number;
}

// Compute scores according to the official university rubric (Sheet 1)
function computeEvaluationTotals(data: {
  experiments?: ExperimentInput[];
  internalViva?: number;
  endSemLabTest?: number;
  endSemViva?: number;
}) {
  const exps: ExperimentInput[] = Array.from({ length: 10 }, (_, i) => {
    const existing = data.experiments?.find((e) => e.exp === i + 1);
    return {
      exp: i + 1,
      notebook: Math.max(0, Math.min(2, Number(existing?.notebook) || 0)),
      performance: Math.max(0, Math.min(2, Number(existing?.performance) || 0)),
    };
  });

  const experimentsTotal = Math.min(
    40,
    exps.reduce((sum, e) => sum + (e.notebook || 0) + (e.performance || 0), 0)
  );

  const internalViva = Math.max(0, Math.min(10, Number(data.internalViva) || 0));
  const totalInternal = Math.min(50, experimentsTotal + internalViva);

  const endSemLabTest = Math.max(0, Math.min(30, Number(data.endSemLabTest) || 0));
  const endSemViva = Math.max(0, Math.min(20, Number(data.endSemViva) || 0));
  const totalEndSem = Math.min(50, endSemLabTest + endSemViva);

  const finalMarks = Math.min(100, totalInternal + totalEndSem);

  return {
    experiments: exps,
    experimentsTotal,
    internalViva,
    totalInternal,
    endSemLabTest,
    endSemViva,
    totalEndSem,
    finalMarks,
  };
}

/**
 * GET /api/v1/evaluations/course/:courseCode
 * Fetch continuous evaluation register for a course, merging registered evaluations with enrolled students
 */
export const getCourseEvaluations = catchAsync(async (req: Request, res: Response) => {
  const courseCodeParam = req.params["courseCode"];
  const courseCode = String(Array.isArray(courseCodeParam) ? courseCodeParam[0] : (courseCodeParam || "")).trim();
  const batchId = req.query["batchId"] as string | undefined;

  // 1. Fetch course details to know title, code, description, and batches
  const course = courseCode
    ? await prisma.course.findFirst({
        where: {
          OR: [
            { code: { equals: courseCode, mode: "insensitive" } },
            { id: courseCode },
            { title: { contains: courseCode, mode: "insensitive" } },
          ],
        },
        include: {
          batches: {
            include: { enrollments: true, course: true },
            orderBy: { startYear: "desc" },
          },
        },
      })
    : null;

  // 2. Fetch existing evaluation records
  const whereClause: Record<string, unknown> = {};
  if (courseCode) {
    whereClause["courseCode"] = course?.code || courseCode;
  }
  if (batchId) {
    whereClause["batchId"] = batchId;
  }

  const existingEvaluations = await prisma.labContinuousEvaluation.findMany({
    where: whereClause,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          universityId: true,
          email: true,
          department: true,
        },
      },
      evaluator: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { student: { universityId: "asc" } },
  });

  // 3. Resolve batch
  const courseBatches = course?.batches;
  const resolvedBatchId =
    batchId ||
    existingEvaluations.find((e) => e.batchId)?.batchId ||
    courseBatches?.[0]?.id;

  const batch = resolvedBatchId
    ? await prisma.batch.findUnique({
        where: { id: resolvedBatchId },
        include: { course: true },
      })
    : courseBatches?.[0] || null;

  // 4. Fetch students who are enrolled in this batch (or course)
  const studentWhere: Record<string, unknown> = { role: "STUDENT" };
  if (resolvedBatchId) {
    studentWhere["enrollments"] = { some: { batchId: resolvedBatchId } };
  } else if (courseBatches && courseBatches.length > 0) {
    const batchIds = courseBatches.map((b) => b.id);
    studentWhere["enrollments"] = { some: { batchId: { in: batchIds } } };
  }

  const allStudents = await prisma.user.findMany({
    where: studentWhere,
    select: {
      id: true,
      name: true,
      universityId: true,
      email: true,
      department: true,
    },
    orderBy: { universityId: "asc" },
  });

  // 5. Derive dynamic metadata strictly from actual entities
  const labAssignment = resolvedBatchId
    ? await prisma.labAssignment.findFirst({
        where: { batchId: resolvedBatchId },
        include: { creator: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const evalInstructor = existingEvaluations.find((e) => e.evaluator?.name)?.evaluator?.name;
  const userInstructor =
    req.user && (req.user.role === "SUPERVISOR" || req.user.role === "ADMIN")
      ? req.user.name
      : null;

  const instructor =
    evalInstructor ||
    labAssignment?.creator?.name ||
    userInstructor ||
    "";

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const isEven = currentMonth >= 1 && currentMonth <= 6;
  const session = `${isEven ? "EVEN SEM MAY" : "ODD SEM NOV"} ${currentYear}`;

  const evalSemester = existingEvaluations.find((e) => e.semester)?.semester;
  let semester = evalSemester || "";
  if (!semester) {
    const startYear = batch?.startYear;
    if (startYear) {
      const yearDiff = currentYear - startYear;
      const semNum = Math.max(1, Math.min(8, isEven ? yearDiff * 2 : yearDiff * 2 + 1));
      const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
      semester = roman[semNum - 1] || "";
    }
  }

  const batchCourse = batch?.course || course;
  const programme =
    existingEvaluations.find((e) => e.programme)?.programme ||
    batchCourse?.title ||
    batchCourse?.description ||
    batch?.name ||
    allStudents[0]?.department ||
    "";

  const courseName =
    existingEvaluations.find((e) => e.courseName)?.courseName ||
    labAssignment?.subject ||
    batchCourse?.title ||
    labAssignment?.title ||
    "";

  const finalCourseCode =
    batchCourse?.code ||
    existingEvaluations.find((e) => e.courseCode)?.courseCode ||
    courseCode;

  // Map of existing records by studentId
  const evalMap = new Map(existingEvaluations.map((e) => [e.studentId, e]));

  // Combine to ensure every student appears in the register
  const register = allStudents.map((student, idx) => {
    const record = evalMap.get(student.id);
    if (record) {
      return {
        slNo: idx + 1,
        id: record.id,
        studentId: student.id,
        roll: student.universityId || "",
        name: student.name,
        programme: record.programme || student.department || programme,
        courseCode: record.courseCode || finalCourseCode,
        courseName: record.courseName || courseName,
        semester: record.semester || semester,
        experiments: record.experiments,
        experimentsTotal: record.experimentsTotal,
        internalViva: record.internalViva,
        totalInternal: record.totalInternal,
        endSemLabTest: record.endSemLabTest,
        endSemViva: record.endSemViva,
        totalEndSem: record.totalEndSem,
        finalMarks: record.finalMarks,
        remarks: record.remarks || "",
        updatedAt: record.updatedAt,
      };
    }

    // Default blank template for un-evaluated student
    const defaultComputed = computeEvaluationTotals({});
    return {
      slNo: idx + 1,
      id: null,
      studentId: student.id,
      roll: student.universityId || "",
      name: student.name,
      programme: student.department || programme,
      courseCode: finalCourseCode,
      courseName,
      semester,
      ...defaultComputed,
      remarks: "",
      updatedAt: new Date(),
    };
  });

  res.status(200).json({
    status: "success",
    metadata: {
      programme,
      semester,
      courseName,
      courseCode: finalCourseCode,
      instructor,
      session,
      maxMarks: {
        experiments: 40,
        internalViva: 10,
        totalInternal: 50,
        endSemLabTest: 30,
        endSemViva: 20,
        totalEndSem: 50,
        finalMarks: 100,
      },
    },
    count: register.length,
    data: register,
  });
});

/**
 * PUT /api/v1/evaluations/course/:courseCode/student/:studentId
 * Update or insert single student continuous evaluation
 */
export const upsertStudentEvaluation = catchAsync(async (req: Request, res: Response) => {
  const courseCodeParam = req.params["courseCode"];
  const courseCode = String(Array.isArray(courseCodeParam) ? courseCodeParam[0] : (courseCodeParam || "")).trim();
  if (!courseCode) throw new BadRequestError("Course Code is required");

  const studentIdParam = req.params["studentId"];
  const studentId = String(Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam);
  if (!studentId) throw new BadRequestError("Student ID is required");

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, department: true, enrollments: { select: { batchId: true } } },
  });
  if (!student) throw new NotFoundError("Student");

  // M-03: BOLA guard — only ADMIN or a supervisor with a lab assignment in the student's batch may grade
  if (req.user?.role !== "ADMIN") {
    const studentBatchIds = student.enrollments.map((e) => e.batchId);
    if (studentBatchIds.length > 0) {
      const hasLabInBatch = await prisma.labAssignment.findFirst({
        where: {
          creatorId: req.user!.id,
          batchId: { in: studentBatchIds },
        },
        select: { id: true },
      });
      if (!hasLabInBatch) {
        throw new NotFoundError("Course or batch");
      }
    }
  }

  const computed = computeEvaluationTotals(req.body);
  const evaluatorId = req.user?.id ?? null;
  const remarks = typeof req.body.remarks === "string" ? req.body.remarks : null;
  const batchId = typeof req.body.batchId === "string" ? req.body.batchId : null;
  const expJson = computed.experiments as unknown as Prisma.InputJsonValue;

  const updateData: Prisma.LabContinuousEvaluationUncheckedUpdateInput = {
    experiments: expJson,
    experimentsTotal: computed.experimentsTotal,
    internalViva: computed.internalViva,
    totalInternal: computed.totalInternal,
    endSemLabTest: computed.endSemLabTest,
    endSemViva: computed.endSemViva,
    totalEndSem: computed.totalEndSem,
    finalMarks: computed.finalMarks,
    evaluatorId,
    remarks,
  };

  const evaluation = await prisma.labContinuousEvaluation.upsert({
    where: {
      studentId_courseCode: {
        studentId,
        courseCode,
      },
    },
    create: {
      studentId,
      courseCode,
      courseName: typeof req.body.courseName === "string" ? req.body.courseName : "",
      semester: typeof req.body.semester === "string" ? req.body.semester : "",
      programme: typeof req.body.programme === "string" ? req.body.programme : (student.department || ""),
      batchId,
      evaluatorId,
      experiments: expJson,
      experimentsTotal: computed.experimentsTotal,
      internalViva: computed.internalViva,
      totalInternal: computed.totalInternal,
      endSemLabTest: computed.endSemLabTest,
      endSemViva: computed.endSemViva,
      totalEndSem: computed.totalEndSem,
      finalMarks: computed.finalMarks,
      remarks,
    },
    update: updateData,
  });

  res.status(200).json({
    status: "success",
    message: `Evaluation for ${student.name} saved successfully`,
    data: evaluation,
  });
});

/**
 * POST /api/v1/evaluations/course/:courseCode/bulk
 * Bulk save evaluations for multiple students
 */
export const bulkUpsertCourseEvaluations = catchAsync(async (req: Request, res: Response) => {
  const courseCodeParam = req.params["courseCode"];
  const courseCode = String(Array.isArray(courseCodeParam) ? courseCodeParam[0] : (courseCodeParam || "")).trim();
  if (!courseCode) throw new BadRequestError("Course Code is required");

  const { evaluations } = req.body;

  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    throw new BadRequestError("Evaluations array is required and cannot be empty");
  }

  // FLAW-06: Guard against DoS via massive transaction
  if (evaluations.length > 200) {
    throw new BadRequestError("Bulk evaluation request exceeds maximum batch size of 200 records");
  }

  const evaluatorId = req.user?.id ?? null;

  const results = await prisma.$transaction(
    evaluations.map((item) => {
      const computed = computeEvaluationTotals(item);
      const studentId = String(item.studentId);
      const expJson = computed.experiments as unknown as Prisma.InputJsonValue;
      const batchId = typeof item.batchId === "string" ? item.batchId : null;
      const remarks = typeof item.remarks === "string" ? item.remarks : null;

      const updateData: Prisma.LabContinuousEvaluationUncheckedUpdateInput = {
        experiments: expJson,
        experimentsTotal: computed.experimentsTotal,
        internalViva: computed.internalViva,
        totalInternal: computed.totalInternal,
        endSemLabTest: computed.endSemLabTest,
        endSemViva: computed.endSemViva,
        totalEndSem: computed.totalEndSem,
        finalMarks: computed.finalMarks,
        evaluatorId,
        remarks,
      };

      return prisma.labContinuousEvaluation.upsert({
        where: {
          studentId_courseCode: {
            studentId,
            courseCode,
          },
        },
        create: {
          studentId,
          courseCode,
          courseName: typeof item.courseName === "string" ? item.courseName : "",
          semester: typeof item.semester === "string" ? item.semester : "",
          programme: typeof item.programme === "string" ? item.programme : "",
          batchId,
          evaluatorId,
          experiments: expJson,
          experimentsTotal: computed.experimentsTotal,
          internalViva: computed.internalViva,
          totalInternal: computed.totalInternal,
          endSemLabTest: computed.endSemLabTest,
          endSemViva: computed.endSemViva,
          totalEndSem: computed.totalEndSem,
          finalMarks: computed.finalMarks,
          remarks,
        },
        update: updateData,
      });
    })
  );

  await logActivity({
    userId: req.user!.id,
    type: "GRADES_EXPORTED",
    payload: {
      courseCode,
      updatedCount: results.length,
    },
  });

  res.status(200).json({
    status: "success",
    message: `Successfully saved ${results.length} student continuous evaluations`,
    count: results.length,
    data: results,
  });
});
