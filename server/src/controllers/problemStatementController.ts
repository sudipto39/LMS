// src/controllers/problemStatementController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError } from "../utils/appError.js";
import { logActivity } from "../services/activityService.js";
import { requireParam } from "../utils/requireParam.js";

// ── 1. Create Problem Statement / Idea Proposal ──────────────────────────────
export const createProblemStatement = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!;
    const {
      title,
      description,
      domain,
      technologies,
      difficulty = "INTERMEDIATE",
      expectedOutcomes,
      prerequisites,
      maxSelections = 3,
    } = req.body as {
      title: string;
      description: string;
      domain: string;
      technologies: string[];
      difficulty?: string;
      expectedOutcomes?: string;
      prerequisites?: string;
      maxSelections?: number;
    };

    // Admins can auto-approve; Supervisors start as PENDING
    const initialStatus = user.role === "ADMIN" ? "APPROVED" : "PENDING";

    const statement = await prisma.problemStatement.create({
      data: {
        title,
        description,
        domain,
        technologies,
        difficulty,
        expectedOutcomes: expectedOutcomes || null,
        prerequisites: prerequisites || null,
        maxSelections: Number(maxSelections) || 3,
        status: initialStatus,
        creatorId: user.id,
        ...(user.role === "ADMIN" && {
          reviewedById: user.id,
          reviewedAt: new Date(),
        }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    });

    await logActivity({
      type: "PROBLEM_STATEMENT_CREATED",
      userId: user.id,
      payload: {
        statementId: statement.id,
        title: statement.title,
        domain: statement.domain,
        status: statement.status,
      },
    });

    res.status(201).json({
      status: "success",
      data: statement,
    });
  }
);

// ── 2. Get Approved Catalog for Students & Platform ─────────────────────────
export const getApprovedCatalog = catchAsync(
  async (req: Request, res: Response) => {
    const { domain, search } = req.query as { domain?: string; search?: string };

    const whereClause: any = {
      status: "APPROVED",
    };

    if (domain && domain !== "all" && domain !== "All") {
      whereClause.domain = {
        equals: domain,
        mode: "insensitive",
      };
    }

    if (search && search.trim()) {
      const safeSearch = search.trim().slice(0, 500); // cap to prevent ReDoS via long ILIKE patterns
      whereClause.OR = [
        { title: { contains: safeSearch, mode: "insensitive" } },
        { description: { contains: safeSearch, mode: "insensitive" } },
        { technologies: { hasSome: [safeSearch] } },
      ];
    }

    const statements = await prisma.problemStatement.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, name: true, email: true, department: true },
        },
        _count: {
          select: {
            projects: {
              where: {
                status: { not: "ARCHIVED" },
              },
            },
          },
        },
        projects: {
          where: { status: { not: "ARCHIVED" } },
          select: {
            id: true,
            title: true,
            ownerId: true,
            owner: { select: { id: true, name: true, email: true, department: true } },
          },
        },
      },
    });

    const catalog = statements.map((item) => {
      const currentSelections = item._count.projects;
      const maxSelections = item.maxSelections || 3;
      const isFull = currentSelections >= maxSelections;
      const availableSlots = Math.max(0, maxSelections - currentSelections);

      return {
        ...item,
        currentSelections,
        isFull,
        availableSlots,
      };
    });

    res.status(200).json({
      status: "success",
      count: catalog.length,
      data: catalog,
    });
  }
);

// ── 3. Get Supervisor's Own Proposals ────────────────────────────────────────
export const getMyProposals = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!;

    const proposals = await prisma.problemStatement.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            projects: {
              where: { status: { not: "ARCHIVED" } },
            },
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      count: proposals.length,
      data: proposals,
    });
  }
);

// ── 4. Get Admin Pending Proposals Queue ─────────────────────────────────────
export const getPendingProposals = catchAsync(
  async (_req: Request, res: Response) => {
    const pending = await prisma.problemStatement.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        creator: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    });

    res.status(200).json({
      status: "success",
      count: pending.length,
      data: pending,
    });
  }
);

// ── 5. Admin Review Problem Statement (Approve / Reject) ────────────────────
export const reviewProblemStatement = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");
    const { status, adminFeedback } = req.body as {
      status: "APPROVED" | "REJECTED" | "ARCHIVED";
      adminFeedback?: string;
    };

    const VALID_STATEMENT_STATUSES = ["APPROVED", "REJECTED", "ARCHIVED"] as const;
    if (!VALID_STATEMENT_STATUSES.includes(status as typeof VALID_STATEMENT_STATUSES[number])) {
      throw new NotFoundError("Invalid status value. Allowed: APPROVED, REJECTED, ARCHIVED");
    }

    const statement = await prisma.problemStatement.findUnique({
      where: { id },
    });

    if (!statement) {
      throw new NotFoundError("ProblemStatement");
    }

    const updated = await prisma.problemStatement.update({
      where: { id },
      data: {
        status,
        adminFeedback: adminFeedback || null,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, department: true },
        },
      },
    });

    await logActivity({
      type: "PROBLEM_STATEMENT_REVIEWED",
      userId: req.user!.id,
      payload: {
        statementId: id,
        decision: status,
        feedback: adminFeedback,
        creatorId: statement.creatorId,
      },
    });

    res.status(200).json({
      status: "success",
      data: updated,
    });
  }
);

// ── 6. Get Single Problem Statement Details ──────────────────────────────────
export const getProblemStatementById = catchAsync(
  async (req: Request, res: Response) => {
    const id = requireParam(req.params["id"], "id");

    const statement = await prisma.problemStatement.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, department: true },
        },
        _count: {
          select: {
            projects: {
              where: { status: { not: "ARCHIVED" } },
            },
          },
        },
      },
    });

    if (!statement) {
      throw new NotFoundError("ProblemStatement");
    }

    const currentSelections = statement._count.projects;
    const maxSelections = statement.maxSelections || 3;

    res.status(200).json({
      status: "success",
      data: {
        ...statement,
        currentSelections,
        isFull: currentSelections >= maxSelections,
        availableSlots: Math.max(0, maxSelections - currentSelections),
      },
    });
  }
);
