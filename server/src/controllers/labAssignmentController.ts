// src/controllers/labAssignmentController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../utils/appError.js";
import { logActivity } from "../services/activityService.js";
import { requireParam } from "../utils/requireParam.js";
import { gradingService, type TestCaseItem } from "../services/gradingService.js";
import { redis } from "../config/redis.js";

// ── 1. Create Lab Assignment (Supervisor / Admin) ─────────────────────────────
export const createLabAssignment = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const {
      title,
      objective,
      description,
      subject = "General Programming",
      prerequisites,
      batchId,
      submissionType = "PDF_REPORT",
      manualUrl,
      manualName,
      language = "python",
      starterCode,
      testCases = [],
      timeLimit = 2.0,
      memoryLimit = 128000,
      totalPoints = 100,
      dueDate,
      allowLate = false,
      status = "PUBLISHED",
    } = req.body as {
      title: string;
      objective: string;
      description: string;
      subject?: string;
      prerequisites?: string;
      batchId: string;
      submissionType?: "CODING" | "PDF_REPORT";
      manualUrl?: string;
      manualName?: string;
      language?: string;
      starterCode?: string;
      testCases?: TestCaseItem[];
      timeLimit?: number;
      memoryLimit?: number;
      totalPoints?: number;
      dueDate?: string;
      allowLate?: boolean;
      status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
    };

    if (!title || !objective || !description || !batchId) {
      throw new BadRequestError("Title, Objective, Description, and Batch ID are required");
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, name: true },
    });

    if (!batch) {
      throw new NotFoundError("Batch");
    }

    // Format test cases with IDs
    const formattedTestCases = (testCases || []).map((tc, idx) => ({
      id: tc.id ?? `tc_${Date.now()}_${idx + 1}`,
      input: tc.input || "",
      expectedOutput: tc.expectedOutput || "",
      isHidden: !!tc.isHidden,
      weight: typeof tc.weight === "number" && tc.weight > 0 ? tc.weight : 1,
      explanation: tc.explanation ?? "",
    }));

    const labAssignment = await prisma.labAssignment.create({
      data: {
        title,
        objective,
        description,
        subject: subject?.trim() || "General Programming",
        ...(prerequisites !== undefined ? { prerequisites } : {}),
        batchId,
        creatorId: user.id,
        submissionType,
        manualUrl: manualUrl || null,
        manualName: manualName || null,
        language: language ? language.toLowerCase() : "python",
        ...(starterCode !== undefined ? { starterCode } : {}),
        testCases: formattedTestCases as any,
        timeLimit: Number(timeLimit),
        memoryLimit: Number(memoryLimit),
        totalPoints: Number(totalPoints),
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        allowLate: !!allowLate,
        status,
      },
      include: {
        batch: { select: { id: true, name: true, course: { select: { id: true, title: true, code: true } } } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      type: "LAB_ASSIGNMENT_CREATED",
      userId: user.id,
      payload: {
        assignmentId: labAssignment.id,
        title: labAssignment.title,
        batchName: batch.name,
        subject: labAssignment.subject,
        objective: labAssignment.objective,
      },
    });

    res.status(201).json({ status: "success", data: labAssignment });
  }
);

// ── 2. Get Lab Assignments (Role Aware) ───────────────────────────────────────
export const getLabAssignments = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const { batchId } = req.query as { batchId?: string };

    let whereClause: any = {};

    if (user.role === "STUDENT") {
      // Find all batches the student is enrolled in
      const enrollments = await prisma.batchEnrollment.findMany({
        where: { userId: user.id },
        select: { batchId: true },
      });
      const enrolledBatchIds = enrollments.map((e) => e.batchId);

      if (enrolledBatchIds.length === 0) {
        res.status(200).json({ status: "success", data: [] });
        return;
      }

      if (batchId) {
        if (!enrolledBatchIds.includes(batchId)) {
          // Student cannot query lab assignments from batches they are not enrolled in
          res.status(200).json({ status: "success", data: [] });
          return;
        }
        whereClause = {
          batchId,
          status: { in: ["PUBLISHED", "CLOSED"] },
        };
      } else {
        whereClause = {
          batchId: { in: enrolledBatchIds },
          status: { in: ["PUBLISHED", "CLOSED"] },
        };
      }
    } else {
      whereClause = {
        ...(batchId ? { batchId } : {}),
      };
    }

    const assignments = await prisma.labAssignment.findMany({
      where: whereClause,
      include: {
        batch: { select: { id: true, name: true, course: { select: { id: true, title: true, code: true } } } },
        creator: { select: { id: true, name: true, email: true } },
        submissions: {
          orderBy: { submittedAt: "desc" },
          select: {
            id: true,
            studentId: true,
            score: true,
            status: true,
            testsPassed: true,
            totalTests: true,
            submittedAt: true,
            supervisorFeedback: true,
            manualScoreAdjust: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Mask hidden test cases if requested by student
    const sanitized = assignments.map((assignment) => {
      const rawTests = (assignment.testCases as unknown as any[]) || [];
      const totalTestCount = rawTests.length;
      const publicTestCount = rawTests.filter((t) => !t.isHidden).length;

      let safeTestCases = rawTests;
      if (user.role === "STUDENT") {
        safeTestCases = rawTests.map((tc) =>
          tc.isHidden
            ? {
                id: tc.id,
                input: "(Hidden Input)",
                expectedOutput: "(Hidden Output)",
                isHidden: true,
                weight: tc.weight,
              }
            : tc
        );
      }

      const studentSubmissions = assignment.submissions.filter(
        (s) => s.studentId === user.id
      );
      const mySubmission =
        user.role === "STUDENT" && studentSubmissions.length > 0
          ? studentSubmissions[0]
          : null;

      // Count unique students who have submitted (not total submission attempts)
      const uniqueSubmitterIds = new Set(assignment.submissions.map((s) => s.studentId));
      const submissionCount = uniqueSubmitterIds.size;

      // FLAW-05: Do not expose peer submissions to students
      const { submissions: _subs, ...assignmentWithoutSubmissions } = assignment;

      return {
        ...(user.role === "STUDENT" ? assignmentWithoutSubmissions : assignment),
        testCases: safeTestCases,
        totalTestCount,
        publicTestCount,
        submissionCount,
        mySubmission,
      };
    });

    res.status(200).json({ status: "success", data: sanitized });
  }
);

// ── 3. Get Single Lab Assignment By ID ─────────────────────────────────────────
export const getLabAssignmentById = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const user = req.user!;

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
        submissions: {
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError("Lab Assignment");
    }

    if (user.role === "STUDENT") {
      const enrollment = await prisma.batchEnrollment.findUnique({
        where: {
          userId_batchId: { userId: user.id, batchId: assignment.batchId },
        },
      });
      if (!enrollment) {
        throw new ForbiddenError("You are not enrolled in the batch for this lab experiment");
      }
    }

    const rawTests = (assignment.testCases as unknown as any[]) || [];
    let safeTestCases = rawTests;
    if (user.role === "STUDENT") {
      safeTestCases = rawTests.map((tc) =>
        tc.isHidden
          ? {
              id: tc.id,
              input: "(Hidden Test Case)",
              expectedOutput: "(Hidden Output)",
              isHidden: true,
              weight: tc.weight,
            }
          : tc
      );
    }

    const userSubmissions = assignment.submissions.filter(
      (s) => s.studentId === user.id
    );

    const { submissions, ...assignmentData } = assignment;

    // FLAW-18: For supervisors, only allow read if they are the creator or an admin
    if (user.role === "SUPERVISOR" && assignment.creatorId !== user.id) {
      // supervisor can see their own assignment's data, but not other supervisors' full submissions
      res.status(200).json({
        status: "success",
        data: {
          ...assignmentData,
          testCases: safeTestCases,
          mySubmissions: userSubmissions,
        },
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        ...assignmentData,
        testCases: safeTestCases,
        mySubmissions: userSubmissions,
        ...(user.role !== "STUDENT" ? { submissions } : {}),
      },
    });
  }
);

// ── 4. Run Public Test Cases (Interactive Sandbox Test) ────────────────────────
export const runPublicTests = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { code, language } = req.body as { code: string; language?: string };

    if (!code) {
      throw new BadRequestError("Code is required");
    }

    if (Buffer.byteLength(code, "utf8") > 50 * 1024) {
      throw new BadRequestError("Source code size exceeds maximum allowed size of 50KB");
    }

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        batchId: true,
        language: true,
        testCases: true,
        timeLimit: true,
        memoryLimit: true,
        totalPoints: true,
      },
    });

    if (!assignment) {
      throw new NotFoundError("Lab Assignment");
    }

    if (req.user!.role === "STUDENT") {
      const enrollment = await prisma.batchEnrollment.findUnique({
        where: {
          userId_batchId: { userId: req.user!.id, batchId: assignment.batchId },
        },
      });
      if (!enrollment) {
        throw new ForbiddenError("You are not enrolled in the batch for this lab experiment");
      }
    }

    const allTests = ((assignment.testCases as unknown) as TestCaseItem[]) || [];
    // Filter only public test cases
    let publicTests = allTests.filter((t) => !t.isHidden);

    if (publicTests.length === 0 && allTests.length > 0) {
      const first = allTests[0];
      if (first) {
        publicTests = [first];
      }
    }

    const assignmentLang = assignment.language || "python";
    const selectedLang = (language || (assignmentLang === "all" ? "python" : assignmentLang)).toLowerCase();

    const results = await gradingService.evaluateCode({
      sourceCode: code,
      language: selectedLang,
      testCases: publicTests,
      timeLimit: assignment.timeLimit,
      memoryLimit: assignment.memoryLimit,
      totalPoints: assignment.totalPoints,
      isSubmission: false,
    });

    res.status(200).json({ status: "success", data: results });
  }
);

// ── 5. Submit Lab Assignment (Full Evaluation against All Tests) ──────────────
export const submitLabAssignment = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const user = req.user!;
    const { code, language } = req.body as { code: string; language?: string };

    if (!code) {
      throw new BadRequestError("Source code is required for submission");
    }

    if (Buffer.byteLength(code, "utf8") > 50 * 1024) {
      throw new BadRequestError("Source code size exceeds maximum allowed size of 50KB");
    }

    try {
      const redisKey = `ratelimit:labsubmit:${user.id}`;
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, 60);
      }
      if (current > 10) {
        res.status(429).json({
          status: "fail",
          message: "Submission rate limit exceeded. Maximum 10 submissions per minute allowed.",
        });
        return;
      }
    } catch {
      // Ignore Redis connection errors
    }

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundError("Lab Assignment");
    }

    // Check student enrollment
    if (user.role === "STUDENT") {
      const enrollment = await prisma.batchEnrollment.findUnique({
        where: {
          userId_batchId: { userId: user.id, batchId: assignment.batchId },
        },
      });
      if (!enrollment) {
        throw new ForbiddenError("You are not enrolled in the batch for this lab experiment");
      }
    }

    // Check deadline
    if (
      assignment.dueDate &&
      new Date() > new Date(assignment.dueDate) &&
      !assignment.allowLate
    ) {
      throw new BadRequestError("Submission deadline has passed and late submissions are not allowed");
    }

    const allTests = ((assignment.testCases as unknown) as TestCaseItem[]) || [];
    const assignmentLang = assignment.language || "python";
    const selectedLang = (language || (assignmentLang === "all" ? "python" : assignmentLang)).toLowerCase();

    const evaluation = await gradingService.evaluateCode({
      sourceCode: code,
      language: selectedLang,
      testCases: allTests,
      timeLimit: assignment.timeLimit,
      memoryLimit: assignment.memoryLimit,
      totalPoints: assignment.totalPoints,
      isSubmission: true,
    });

    // Determine attempt number and check supervisor permission for re-uploads
    const previousSubmissions = await prisma.labSubmission.findMany({
      where: {
        assignmentId: id,
        studentId: user.id,
      },
      orderBy: { attemptNumber: "desc" },
    });

    const previousSubmissionsCount = previousSubmissions.length;
    const latestSub = previousSubmissions[0];

    if (previousSubmissionsCount > 0) {
      if (latestSub?.reuploadStatus !== "APPROVED") {
        if (latestSub?.reuploadStatus === "PENDING") {
          throw new ForbiddenError(
            "Your re-upload request is currently pending supervisor approval. You will be able to submit once approved."
          );
        }
        throw new ForbiddenError(
          "Re-uploading this lab assignment requires supervisor permission. Please request permission from your supervisor first."
        );
      }
    }

    const submission = await prisma.labSubmission.create({
      data: {
        assignmentId: id,
        studentId: user.id,
        code,
        language: selectedLang,
        status: evaluation.status === "PASSED" ? "PASSED" : "EVALUATED",
        score: evaluation.score,
        testsPassed: evaluation.testsPassed,
        totalTests: evaluation.totalTests,
        testResults: evaluation.testResults as any,
        executionTime: evaluation.maxExecutionTime,
        memoryUsed: evaluation.maxMemoryUsed,
        attemptNumber: previousSubmissionsCount + 1,
        reuploadStatus: null,
      },
    });

    if (latestSub && latestSub.reuploadStatus === "APPROVED") {
      await prisma.labSubmission.update({
        where: { id: latestSub.id },
        data: { reuploadStatus: "CONSUMED" },
      });
    }

    await logActivity({
      type: "LAB_SUBMISSION_COMPLETED",
      userId: user.id,
      payload: {
        assignmentId: id,
        assignmentTitle: assignment.title,
        batchName: assignment.batch.name,
        score: evaluation.score,
        totalPoints: assignment.totalPoints,
        testsPassed: `${evaluation.testsPassed}/${evaluation.totalTests}`,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        submission,
        evaluation,
      },
    });
  }
);

// ── 5b. Submit PDF Lab Report (Document / Writeup Upload) ─────────────────────
export const submitLabReport = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const user = req.user!;
    const file = req.file as any;
    const { studentNotes } = req.body as { studentNotes?: string };

    if (!file) {
      throw new BadRequestError("PDF report file is required for submission");
    }

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundError("Lab Assignment");
    }

    // Check student enrollment
    if (user.role === "STUDENT") {
      const enrollment = await prisma.batchEnrollment.findUnique({
        where: {
          userId_batchId: { userId: user.id, batchId: assignment.batchId },
        },
      });
      if (!enrollment) {
        throw new ForbiddenError("You are not enrolled in the batch for this lab experiment");
      }
    }

    // Check deadline
    if (
      assignment.dueDate &&
      new Date() > new Date(assignment.dueDate) &&
      !assignment.allowLate
    ) {
      throw new BadRequestError("Submission deadline has passed and late submissions are not allowed");
    }

    const previousSubmissions = await prisma.labSubmission.findMany({
      where: {
        assignmentId: id,
        studentId: user.id,
      },
      orderBy: { attemptNumber: "desc" },
    });

    const previousSubmissionsCount = previousSubmissions.length;
    const latestSub = previousSubmissions[0];

    if (previousSubmissionsCount > 0) {
      if (latestSub?.reuploadStatus !== "APPROVED") {
        if (latestSub?.reuploadStatus === "PENDING") {
          throw new ForbiddenError(
            "Your re-upload request is currently pending supervisor approval. You will be able to upload once approved."
          );
        }
        throw new ForbiddenError(
          "Re-uploading this lab report requires supervisor permission. Please request permission before uploading a new report."
        );
      }
    }

    const fileUrl = file.location || `/api/v1/uploads/files/${file.filename}`;
    // M-05: Sanitize stored filename to prevent stored XSS — same pattern as milestoneController (FLAW-R2-14)
    const rawFileName = (file.originalname || file.filename || "") as string;
    const fileName = rawFileName
      .replace(/[<>"'`]/g, "_")   // strip XSS trigger chars
      .replace(/[\r\n\0]/g, "")   // strip control chars
      .substring(0, 255)
      || "report";
    const fileSize = file.size || 0;

    const submission = await prisma.labSubmission.create({
      data: {
        assignmentId: id,
        studentId: user.id,
        fileUrl,
        fileName,
        fileSize,
        studentNotes: studentNotes?.trim() || null,
        status: "PENDING",
        score: 0,
        attemptNumber: previousSubmissionsCount + 1,
        reuploadStatus: null,
      },
      include: {
        assignment: { select: { id: true, title: true, totalPoints: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    if (latestSub && latestSub.reuploadStatus === "APPROVED") {
      await prisma.labSubmission.update({
        where: { id: latestSub.id },
        data: { reuploadStatus: "CONSUMED" },
      });
    }

    await logActivity({
      type: "LAB_SUBMISSION_COMPLETED",
      userId: user.id,
      payload: {
        assignmentId: id,
        assignmentTitle: assignment.title,
        batchName: assignment.batch.name,
        fileName,
        submissionType: "PDF_REPORT",
      },
    });

    res.status(201).json({
      status: "success",
      data: submission,
    });
  }
);

// ── 6. Get Batch Submissions Roster (Supervisor / Admin) ──────────────────────
export const getAssignmentSubmissionsRoster = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        batch: {
          include: {
            course: true,
            enrollments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    universityId: true,
                    department: true,
                  },
                },
              },
            },
          },
        },
        submissions: {
          orderBy: { submittedAt: "desc" },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                universityId: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError("Lab Assignment");
    }

    // FLAW-10: Supervisors can only view submissions rosters for assignments they created
    if (req.user!.role !== "ADMIN" && !(req.user!.role === "SUPERVISOR" && assignment.creatorId === req.user!.id)) {
      throw new ForbiddenError("You do not have permission to view submissions for this assignment");
    }

    const students = assignment.batch.enrollments.map((e) => e.user);

    // Group latest submission per student
    const roster = students.map((student) => {
      const studentSubmissions = assignment.submissions.filter(
        (s) => s.studentId === student.id
      );
      const latestSubmission = studentSubmissions[0] || null;

      return {
        student,
        hasSubmitted: !!latestSubmission,
        submissionCount: studentSubmissions.length,
        latestSubmission,
      };
    });

    const totalStudents = students.length;
    const submittedCount = roster.filter((r) => r.hasSubmitted).length;
    const averageScore =
      submittedCount > 0
        ? Math.round(
            (roster.reduce(
              (acc, r) => acc + (r.latestSubmission?.score || 0),
              0
            ) /
              submittedCount) *
              10
          ) / 10
        : 0;

    // Dynamically calculate session, semester, and official register metadata
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const isEven = currentMonth >= 1 && currentMonth <= 6;
    const session = `${isEven ? "EVEN SEM MAY" : "ODD SEM NOV"} ${currentYear}`;

    let semester = "";
    const startYear = assignment.batch?.startYear;
    if (startYear) {
      const yearDiff = currentYear - startYear;
      const semNum = Math.max(1, Math.min(8, isEven ? yearDiff * 2 : yearDiff * 2 + 1));
      const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
      semester = roman[semNum - 1] || "";
    }

    const programme =
      assignment.batch?.course?.title ||
      assignment.batch?.course?.description ||
      assignment.batch?.name ||
      "";

    const courseName =
      assignment.subject ||
      assignment.batch?.course?.title ||
      assignment.title;

    const courseCode = assignment.batch?.course?.code || "";
    const instructor = assignment.creator?.name || req.user?.name || "";

    const metadata = {
      programme,
      semester,
      courseName,
      courseCode,
      instructor,
      session,
    };

    res.status(200).json({
      status: "success",
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          objective: assignment.objective,
          description: assignment.description,
          subject: assignment.subject,
          submissionType: assignment.submissionType,
          manualUrl: assignment.manualUrl,
          manualName: assignment.manualName,
          language: assignment.language,
          totalPoints: assignment.totalPoints,
          dueDate: assignment.dueDate,
          batch: assignment.batch,
          creator: assignment.creator,
        },
        metadata,
        stats: {
          totalStudents,
          submittedCount,
          pendingCount: totalStudents - submittedCount,
          averageScore,
        },
        roster,
      },
    });
  }
);

// ── 7. Grade / Feedback Submission (Supervisor Manual Review) ─────────────────
export const gradeSubmission = catchAsync(
  async (req: Request, res: Response) => {
    const submissionId = requireParam(req.params["submissionId"], "submissionId");
    const {
      score,
      manualScoreAdjust,
      supervisorFeedback,
      notebookScore,
      performanceScore,
      vivaScore,
    } = req.body as {
      score?: number;
      manualScoreAdjust?: number;
      supervisorFeedback?: string;
      notebookScore?: number;
      performanceScore?: number;
      vivaScore?: number;
    };

    const submission = await prisma.labSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            batch: {
              include: { course: true },
            },
          },
        },
        student: true,
      },
    });

    if (!submission) {
      throw new NotFoundError("Submission");
    }

    // M-04: Fixed inverted RBAC — previous logic allowed any SUPERVISOR to grade any assignment
    // Correct: ADMIN can grade all; SUPERVISOR can only grade their own assignments
    const isAdmin = req.user!.role === "ADMIN";
    const isOwnerSupervisor = req.user!.role === "SUPERVISOR" && submission.assignment.creatorId === req.user!.id;
    if (!isAdmin && !isOwnerSupervisor) {
      throw new ForbiddenError("You do not have permission to grade submissions for this assignment");
    }

    const totalPoints = submission.assignment.totalPoints ?? 0;
    const rawScore =
      score !== undefined
        ? Number(score)
        : manualScoreAdjust !== undefined
        ? (submission.score || 0) + Number(manualScoreAdjust)
        : submission.score;

    // FLAW-03: Clamp score to valid range [0, totalPoints]
    const finalScore =
      rawScore !== null && rawScore !== undefined
        ? Math.max(0, Math.min(totalPoints, rawScore))
        : rawScore;

    const updated = await prisma.labSubmission.update({
      where: { id: submissionId },
      data: {
        score: finalScore,
        status: "EVALUATED",
        ...(manualScoreAdjust !== undefined ? {
          manualScoreAdjust: Number(manualScoreAdjust),
        } : {}),
        ...(supervisorFeedback !== undefined ? { supervisorFeedback } : {}),
        ...(notebookScore !== undefined ? { notebookScore: Number(notebookScore) } : {}),
        ...(performanceScore !== undefined ? { performanceScore: Number(performanceScore) } : {}),
        ...(vivaScore !== undefined ? { vivaScore: Number(vivaScore) } : {}),
      },
    });

    // Sync with university continuous practical evaluation register in DB
    try {
      if (notebookScore !== undefined || performanceScore !== undefined || vivaScore !== undefined) {
        const studentId = submission.studentId;
        const courseCode =
          submission.assignment.batch?.course?.code ||
          submission.assignment.batch?.name ||
          "";

        if (courseCode) {
          const expMatch = submission.assignment.title.match(/(?:Lab|Exp|Experiment)\s*#?\s*(\d+)/i);
          const rawExp = expMatch?.[1];
          const expNum = rawExp ? Math.max(1, Math.min(10, parseInt(rawExp, 10))) : 1;

          const existingEval = await prisma.labContinuousEvaluation.findUnique({
            where: {
              studentId_courseCode: {
                studentId,
                courseCode,
              },
            },
          });

          const currentExps: Array<{ exp: number; notebook: number; performance: number }> =
            existingEval && Array.isArray(existingEval.experiments)
              ? (existingEval.experiments as any)
              : Array.from({ length: 10 }, (_, i) => ({ exp: i + 1, notebook: 0, performance: 0 }));

          const expIndex = currentExps.findIndex((e) => e.exp === expNum);
          const targetExp = expIndex >= 0 ? currentExps[expIndex] : undefined;
          if (targetExp && expIndex >= 0) {
            currentExps[expIndex] = {
              exp: expNum,
              notebook: notebookScore !== undefined ? Number(notebookScore) : targetExp.notebook,
              performance: performanceScore !== undefined ? Number(performanceScore) : targetExp.performance,
            };
          } else {
            currentExps.push({
              exp: expNum,
              notebook: notebookScore !== undefined ? Number(notebookScore) : 0,
              performance: performanceScore !== undefined ? Number(performanceScore) : 0,
            });
          }

          const experimentsTotal = Math.min(
            40,
            currentExps.reduce((sum, e) => sum + (Number(e.notebook) || 0) + (Number(e.performance) || 0), 0)
          );

          const internalViva =
            vivaScore !== undefined
              ? Math.max(0, Math.min(10, Number(vivaScore)))
              : existingEval?.internalViva || 0;

          const totalInternal = Math.min(50, experimentsTotal + internalViva);
          const endSemLabTest = existingEval?.endSemLabTest || 0;
          const endSemViva = existingEval?.endSemViva || 0;
          const totalEndSem = Math.min(50, endSemLabTest + endSemViva);
          const finalMarks = Math.min(100, totalInternal + totalEndSem);

          await prisma.labContinuousEvaluation.upsert({
            where: {
              studentId_courseCode: {
                studentId,
                courseCode,
              },
            },
            create: {
              studentId,
              courseCode,
              courseName: submission.assignment.subject || submission.assignment.title,
              programme:
                submission.assignment.batch?.course?.title ||
                submission.student.department ||
                "",
              batchId: submission.assignment.batchId,
              evaluatorId: req.user!.id,
              experiments: currentExps,
              experimentsTotal,
              internalViva,
              totalInternal,
              endSemLabTest,
              endSemViva,
              totalEndSem,
              finalMarks,
            },
            update: {
              experiments: currentExps,
              experimentsTotal,
              internalViva,
              totalInternal,
              finalMarks,
              evaluatorId: req.user!.id,
            },
          });
        }
      }
    } catch {
      // Non-blocking sync
    }

    res.status(200).json({ status: "success", data: updated });
  }
);

// ── 8. Delete Lab Assignment ──────────────────────────────────────────────────
export const deleteLabAssignment = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundError("Lab Assignment");
    }

    if (req.user!.role !== "ADMIN" && assignment.creatorId !== req.user!.id) {
      throw new ForbiddenError("You do not have permission to delete this assignment");
    }

    await prisma.labAssignment.delete({
      where: { id },
    });

    res.status(200).json({
      status: "success",
      message: "Lab assignment deleted successfully",
    });
  }
);

// ── 9. Update Lab Assignment (Details & Status Toggle) ─────────────────────────
export const updateLabAssignment = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const {
      title,
      objective,
      description,
      subject,
      prerequisites,
      submissionType,
      manualUrl,
      manualName,
      language,
      starterCode,
      testCases,
      timeLimit,
      memoryLimit,
      totalPoints,
      dueDate,
      allowLate,
      status,
    } = req.body;

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundError("Lab Assignment");
    }

    // FLAW-11: Supervisors can only update assignments they created
    if (req.user!.role !== "ADMIN" && !(req.user!.role === "SUPERVISOR" && assignment.creatorId === req.user!.id)) {
      throw new ForbiddenError("You do not have permission to modify this assignment");
    }

    const updated = await prisma.labAssignment.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(objective !== undefined ? { objective } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(prerequisites !== undefined ? { prerequisites } : {}),
        ...(submissionType !== undefined ? { submissionType } : {}),
        ...(manualUrl !== undefined ? { manualUrl } : {}),
        ...(manualName !== undefined ? { manualName } : {}),
        ...(language !== undefined ? { language } : {}),
        ...(starterCode !== undefined ? { starterCode } : {}),
        ...(testCases !== undefined ? { testCases } : {}),
        ...(timeLimit !== undefined ? { timeLimit: Number(timeLimit) } : {}),
        ...(memoryLimit !== undefined ? { memoryLimit: Number(memoryLimit) } : {}),
        ...(totalPoints !== undefined ? { totalPoints: Number(totalPoints) } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(allowLate !== undefined ? { allowLate: Boolean(allowLate) } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: {
        batch: { select: { id: true, name: true, course: { select: { id: true, title: true } } } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({
      status: "success",
      data: updated,
    });
  }
);

// ── 10. Rename Subject Folder (Batch Update) ──────────────────────────────────
export const renameSubjectFolder = catchAsync(
  async (req: Request, res: Response) => {
    const { oldSubject, newSubject, batchId } = req.body as {
      oldSubject: string;
      newSubject: string;
      batchId?: string;
    };

    if (!batchId) {
      throw new BadRequestError("Batch ID is required for folder operations");
    }

    // FLAW-16: Guard against empty subject string triggering mass updates
    if (!oldSubject || typeof oldSubject !== "string" || !oldSubject.trim()) {
      throw new BadRequestError("oldSubject must be a non-empty string");
    }
    if (!newSubject || typeof newSubject !== "string" || !newSubject.trim()) {
      throw new BadRequestError("newSubject must be a non-empty string");
    }

    // H-03: Sanitize newSubject to prevent stored XSS via folder name in DB + API response
    const safeNewSubject = newSubject
      .replace(/[<>"'`]/g, "_")    // strip XSS trigger chars
      .replace(/[\r\n\0]/g, "")    // strip control chars
      .substring(0, 200)
      .trim();
    if (!safeNewSubject) {
      throw new BadRequestError("newSubject contains only invalid characters");
    }

    const whereClause: any = {
      subject: oldSubject.trim(),
      batchId,
    };
    if (req.user!.role !== "ADMIN") {
      whereClause.creatorId = req.user!.id;
    }

    const count = await prisma.labAssignment.updateMany({
      where: whereClause,
      data: {
        subject: safeNewSubject,
      },
    });

    res.status(200).json({
      status: "success",
      message: `Updated subject folder name to "${safeNewSubject}"`,
      affectedCount: count.count,
    });
  }
);

// ── 11. Toggle Subject Folder Status (Deactivate / Activate All in Folder) ─────
export const toggleSubjectFolderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { subject, status, batchId } = req.body as {
      subject: string;
      status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
      batchId?: string;
    };

    if (!batchId) {
      throw new BadRequestError("Batch ID is required for folder operations");
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      throw new BadRequestError("subject must be a non-empty string");
    }

    // H-02: Validate status enum at runtime — TypeScript types are erased
    const VALID_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"] as const;
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      throw new BadRequestError("Invalid status. Allowed: DRAFT, PUBLISHED, CLOSED, ARCHIVED");
    }

    const whereClause: any = {
      subject: subject.trim(),
      batchId,
    };
    if (req.user!.role !== "ADMIN") {
      whereClause.creatorId = req.user!.id;
    }

    const count = await prisma.labAssignment.updateMany({
      where: whereClause,
      data: {
        status,
      },
    });

    res.status(200).json({
      status: "success",
      message: `Subject folder "${subject.trim()}" status changed to ${status}`,
      affectedCount: count.count,
    });
  }
);

// ── 12. Delete Subject Folder (Delete all labs in this folder) ────────────────
export const deleteSubjectFolder = catchAsync(
  async (req: Request, res: Response) => {
    const { subject, batchId } = req.body as {
      subject: string;
      batchId?: string;
    };

    if (!batchId) {
      throw new BadRequestError("Batch ID is required for folder operations");
    }

    // FLAW-16: Guard against empty subject string triggering mass deletions
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      throw new BadRequestError("subject must be a non-empty string");
    }

    const whereClause: any = {
      subject,
      batchId,
    };
    if (req.user!.role !== "ADMIN") {
      whereClause.creatorId = req.user!.id;
    }

    const count = await prisma.labAssignment.deleteMany({
      where: whereClause,
    });

    res.status(200).json({
      status: "success",
      message: `Subject folder "${subject}" and its experiments deleted`,
      deletedCount: count.count,
    });
  }
);

// ── 15. Student Request Permission to Re-upload Lab Assignment ───────────────
export const requestLabReupload = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const user = req.user!;
    const { reason } = req.body as { reason?: string };

    const assignment = await prisma.labAssignment.findUnique({
      where: { id },
      include: { batch: { select: { id: true, name: true } } },
    });
    if (!assignment) throw new NotFoundError("Lab Assignment");

    // Check student enrollment in batch
    if (user.role === "STUDENT") {
      const enrollment = await prisma.batchEnrollment.findUnique({
        where: { userId_batchId: { userId: user.id, batchId: assignment.batchId } },
      });
      if (!enrollment) throw new ForbiddenError("Not enrolled in this batch");
    }

    const latestSub = await prisma.labSubmission.findFirst({
      where: { assignmentId: id, studentId: user.id },
      orderBy: { attemptNumber: "desc" },
    });

    if (!latestSub) {
      throw new BadRequestError("You have not submitted this lab assignment yet. You can submit directly without permission.");
    }

    if (latestSub.reuploadStatus === "PENDING") {
      throw new BadRequestError("A re-upload permission request is already pending supervisor review.");
    }

    if (latestSub.reuploadStatus === "APPROVED") {
      throw new BadRequestError("You already have permission to re-upload. You can submit your revised report now.");
    }

    const updated = await prisma.labSubmission.update({
      where: { id: latestSub.id },
      data: {
        reuploadStatus: "PENDING",
        reuploadReason: reason?.trim() || "Student requested permission to re-upload lab assignment",
        reuploadRequestedAt: new Date(),
      },
    });

    await logActivity({
      type: "LAB_REUPLOAD_REQUESTED",
      userId: user.id,
      payload: {
        assignmentId: id,
        assignmentTitle: assignment.title,
        submissionId: latestSub.id,
        reason: updated.reuploadReason,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Re-upload permission request submitted to your supervisor successfully.",
      data: updated,
    });
  }
);

// ── 16. Supervisor / Admin Review Re-upload Permission ────────────────────────
export const reviewLabReuploadPermission = catchAsync(
  async (req: Request, res: Response) => {
    const submissionId = requireParam(req.params["submissionId"], "submissionId");
    const user = req.user!;
    const { action, notes } = req.body as { action: "APPROVE" | "REJECT"; notes?: string };

    if (action !== "APPROVE" && action !== "REJECT") {
      throw new BadRequestError("Action must be either 'APPROVE' or 'REJECT'");
    }

    const submission = await prisma.labSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { select: { id: true, title: true, creatorId: true, batchId: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    if (!submission) throw new NotFoundError("Lab Submission");

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.labSubmission.update({
      where: { id: submissionId },
      data: {
        reuploadStatus: newStatus,
        reuploadReviewedAt: new Date(),
        reuploadReviewedBy: user.id,
        ...(notes && { supervisorFeedback: notes }),
      },
    });

    await logActivity({
      type: action === "APPROVE" ? "LAB_REUPLOAD_APPROVED" : "LAB_REUPLOAD_REJECTED",
      userId: user.id,
      payload: {
        assignmentId: submission.assignment.id,
        assignmentTitle: submission.assignment.title,
        studentId: submission.student.id,
        studentName: submission.student.name,
        action,
      },
    });

    res.status(200).json({
      status: "success",
      message: action === "APPROVE"
        ? "Re-upload permission granted. The student can now re-submit."
        : "Re-upload permission request denied.",
      data: updated,
    });
  }
);

