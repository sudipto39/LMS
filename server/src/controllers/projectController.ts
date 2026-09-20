// src/controllers/projectController.ts
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/appError.js";
import { giteaService } from "../services/giteaService.js";
import { logActivity } from "../services/activityService.js";
import { env } from "../config/env.js";
import { requireParam } from "../utils/requireParam.js";
import { formatRepoUrl, resolveProjectRepoInfo } from "../utils/projectHelpers.js";

const projectInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      universityId: true,
      giteaUsername: true,
    },
  },
  supervisor: {
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
    },
  },
  problemStatement: {
    select: {
      id: true,
      title: true,
      domain: true,
      creator: {
        select: { id: true, name: true, email: true, department: true },
      },
    },
  },
  requestedSupervisor: {
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
    },
  },
  batch: {
    select: {
      id: true,
      name: true,
      course: {
        select: {
          id: true,
          title: true,
          code: true,
        },
      },
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          universityId: true,
          department: true,
          giteaUsername: true,
        },
      },
    },
  },
  milestones: {
    where: { isActive: true },
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
      order: true,
      feedback: true,
      studentNotes: true,
      submittedAt: true,
      reviewedAt: true,
      attachments: true,
    },
  },
  evaluation: true,
} as const;

async function checkProjectAccess(
  projectId: string,
  user: { id: string; role: string },
  requireWrite = false
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true } } },
  });
  if (!project) throw new NotFoundError("Project");
  if (user.role === "ADMIN") return project;

  const isOwner = project.ownerId === user.id;
  const isMember = project.members.some((m) => m.userId === user.id);
  const isSupervisor = project.supervisorId === user.id;

  if (requireWrite) {
    if (!isOwner && !isMember) {
      throw new ForbiddenError("You do not have permission to modify this project");
    }
  } else {
    if (!isOwner && !isMember && !isSupervisor) {
      throw new ForbiddenError("You do not have permission to access this project");
    }
  }
  return project;
}

async function checkProjectOwnerOrAdmin(
  projectId: string,
  user: { id: string; role: string }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new NotFoundError("Project");
  if (user.role === "ADMIN") return project;
  if (project.ownerId !== user.id) {
    throw new ForbiddenError("Only the project owner or an admin can perform this operation");
  }
  return project;
}

export const createProject = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    description,
    technologies,
    batchId: reqBatchId,
    courseId,
    supervisorId,
    problemStatementId,
    requestedSupervisorId,
    supervisorRequestReason,
    repoName: customRepoName,
    milestones: customMilestones,
    parentProjectId,
  } = req.body as {
    title: string;
    description?: string;
    technologies?: string[];
    batchId?: string;
    courseId?: string;
    supervisorId?: string;
    problemStatementId?: string;
    requestedSupervisorId?: string;
    supervisorRequestReason?: string;
    repoMode?: "new" | "existing";
    repoName?: string;
    milestones?: Array<{ title: string; due?: string; dueDate?: string }>;
    parentProjectId?: string;
  };

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      giteaUsername: true,
      enrollments: {
        where: { batch: { isActive: true } },
        select: { batchId: true },
        take: 1,
      },
    },
  });

  if (!user) throw new NotFoundError("User");

  let batchId = reqBatchId;
  if (!batchId) {
    batchId = user.enrollments?.[0]?.batchId;
  }

  if (!batchId && courseId) {
    const batch = await prisma.batch.findFirst({
      where: { courseId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (batch) batchId = batch.id;
  }

  if (!batchId) {
    const fallbackBatch = await prisma.batch.findFirst({
      where: { isActive: true },
    });
    if (fallbackBatch) batchId = fallbackBatch.id;
    else throw new BadRequestError("No active academic batch found.");
  }

  const slug = (customRepoName || title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const repoName = `${slug}-${Date.now().toString().slice(-4)}`;
  const giteaUsername =
    user.giteaUsername || user.name.toLowerCase().replace(/\s+/g, "");

  let repoUrl = `${env.GITEA_BASE_URL.replace("/api/v1", "")}/${giteaUsername}/${repoName}.git`;

  try {
    const repo = await giteaService.createRepo(
      giteaUsername,
      repoName,
      description ?? `Project: ${title}`
    );
    if (repo?.clone_url) repoUrl = repo.clone_url;
  } catch (err) {
    console.warn("Gitea repo auto-provisioning notice:", err);
  }

  let phase = 1;
  if (parentProjectId) {
    const parent = await prisma.project.findUnique({
      where: { id: parentProjectId },
      include: { members: { select: { userId: true } } },
    });
    if (!parent) {
      throw new BadRequestError("Parent project not found");
    }
    const isOwner = parent.ownerId === req.user!.id;
    const isMember = parent.members.some((m) => m.userId === req.user!.id);
    if (!isOwner && !isMember && req.user!.role !== "ADMIN") {
      throw new ForbiddenError("You can only extend a project that you own or are a member of");
    }
    phase = parent.phase + 1;
  }

  const isStudent = req.user!.role === "STUDENT";
  const preferredSupervisorId = requestedSupervisorId || (isStudent ? supervisorId : null);

  // ── Atomically verify Problem Statement availability and create project ───
  const project = await prisma.$transaction(async (tx) => {
    if (problemStatementId) {
      const statement = await tx.problemStatement.findUnique({
        where: { id: problemStatementId },
        include: {
          _count: {
            select: {
              projects: {
                where: { status: { not: "ARCHIVED" } },
              },
            },
          },
        },
      });

      if (!statement || statement.status !== "APPROVED") {
        throw new BadRequestError("The selected problem statement is not available or not yet approved.");
      }

      const currentCount = statement._count.projects;
      const maxAllowed = statement.maxSelections || 3;
      if (currentCount >= maxAllowed) {
        throw new BadRequestError(
          `This problem statement has already reached its maximum capacity of ${maxAllowed} teams.`
        );
      }

      // Check if this student/team has already claimed this challenge
      const existingProjectWithIdea = await tx.project.findFirst({
        where: {
          problemStatementId,
          ownerId: user.id,
          status: { not: "ARCHIVED" },
        },
      });

      if (existingProjectWithIdea) {
        throw new BadRequestError(
          "You have already claimed this problem statement as your capstone project."
        );
      }
    }

    return await tx.project.create({
      data: {
        title,
        description: description || null,
        technologies: technologies || ["React", "Node.js", "PostgreSQL"],
        repoName,
        repoUrl,
        ownerId: user.id,
        batchId,
        // Students cannot self-assign supervisors; only Admins can directly assign
        supervisorId: isStudent ? null : supervisorId || null,
        problemStatementId: problemStatementId || null,
        requestedSupervisorId: preferredSupervisorId || null,
        supervisorRequestStatus: preferredSupervisorId ? "PENDING" : null,
        supervisorRequestReason: supervisorRequestReason || null,
        parentProjectId: parentProjectId || null,
        phase,
        status: "IN_PROGRESS",
      },
      include: projectInclude,
    });
  });

  if (Array.isArray(customMilestones) && customMilestones.length > 0) {
    await prisma.milestone.createMany({
      data: customMilestones.map((m, idx) => ({
        projectId: project.id,
        title: m.title,
        dueDate: m.due || m.dueDate ? new Date(m.due || m.dueDate!) : null,
        order: idx + 1,
        status: idx === 0 ? "IN_PROGRESS" : "PENDING",
      })),
    });
  } else {
    await prisma.milestone.createMany({
      data: [
        {
          projectId: project.id,
          title: "Project Proposal & Architecture",
          order: 1,
          status: "IN_PROGRESS",
        },
        {
          projectId: project.id,
          title: "Core Implementation Deliverables",
          order: 2,
          status: "PENDING",
        },
        {
          projectId: project.id,
          title: "Testing, Benchmarks & Defense Documentation",
          order: 3,
          status: "PENDING",
        },
      ],
    });
  }

  await logActivity({
    type: "PROJECT_CREATED",
    payload: { title: project.title, repoName: project.repoName },
    userId: user.id,
    projectId: project.id,
  });

  const refreshedProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: projectInclude,
  });

  res.status(201).json({ status: "success", data: refreshedProject });
});

export const getMyProjects = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      isActive: true,
    },
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  });



  const enriched = projects.map((p) => {
    const totalMilestones = p.milestones.length;
    const approvedMilestones = p.milestones.filter((m) => m.status === "APPROVED").length;
    const progress = totalMilestones > 0 ? Math.round((approvedMilestones / totalMilestones) * 100) : 0;
    return {
      ...p,
      repoUrl: formatRepoUrl(p),
      progress,
      team: [p.owner, ...p.members.map((m) => m.user)],
      supervisor: p.supervisor?.name || "Unassigned",
    };
  });

  res.status(200).json({ status: "success", count: enriched.length, data: enriched });
});

export const getSupervisedProjects = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";

  const projects = await prisma.project.findMany({
    where: isAdmin ? { isActive: true } : { supervisorId: userId, isActive: true },
    include: projectInclude,
    orderBy: { createdAt: "desc" },
  });



  const enriched = projects.map((p) => {
    const totalMilestones = p.milestones.length;
    const approvedMilestones = p.milestones.filter((m) => m.status === "APPROVED").length;
    const progress = totalMilestones > 0 ? Math.round((approvedMilestones / totalMilestones) * 100) : 0;
    return {
      ...p,
      repoUrl: formatRepoUrl(p),
      progress,
      team: [p.owner, ...p.members.map((m) => m.user)],
      supervisor: p.supervisor?.name || "Unassigned",
    };
  });

  res.status(200).json({ status: "success", count: enriched.length, data: enriched });
});

export const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  await checkProjectAccess(id, req.user!, false);
  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });

  if (!project) throw new NotFoundError("Project");

  const giteaRoot = env.GITEA_BASE_URL.replace("/api/v1", "");
  const raw = project.repoUrl || `${giteaRoot}/${project.owner?.giteaUsername || "user"}/${project.repoName || "project"}.git`;
  const repoUrl = raw.replace(/^http:\/\/(localhost|127\.0\.0\.1):3000/, giteaRoot);

  const totalMilestones = project.milestones.length;
  const approvedMilestones = project.milestones.filter((m) => m.status === "APPROVED").length;
  const progress = totalMilestones > 0 ? Math.round((approvedMilestones / totalMilestones) * 100) : 0;

  const enriched = {
    ...project,
    repoUrl,
    progress,
    team: [project.owner, ...project.members.map((m) => m.user)],
    supervisor: project.supervisor?.name || "Unassigned",
  };

  res.status(200).json({ status: "success", data: enriched });
});

export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  await checkProjectAccess(id, req.user!, true);
  const { title, description, technologies } = req.body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(technologies && { technologies }),
    },
    include: projectInclude,
  });

  res.status(200).json({ status: "success", data: project });
});

export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const project = await checkProjectOwnerOrAdmin(id, req.user!);

  // Unlink child projects to prevent foreign key constraint violations
  await prisma.project.updateMany({
    where: { parentProjectId: id },
    data: { parentProjectId: null },
  });

  // Clean up remote Gitea repository if one exists
  if (project.repoUrl || project.repoName) {
    try {
      const { owner, repo } = resolveProjectRepoInfo(project);
      if (owner && repo) {
        await giteaService.deleteRepo(owner, repo);
      }
    } catch (err) {
      console.warn("Gitea repo cleanup notice during project deletion:", err);
    }
  }

  await prisma.project.delete({ where: { id } });
  res.status(200).json({ status: "success", message: "Project deleted" });
});

export const submitFinalProject = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  await checkProjectAccess(id, req.user!, true);
  const project = await prisma.project.update({
    where: { id },
    data: { status: "SUBMITTED" },
    include: projectInclude,
  });
  res.status(200).json({ status: "success", data: project });
});

export const getProjectFiles = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectAccess(projectId, req.user!, false);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { owner: true },
  });
  if (!project) throw new NotFoundError("Project");

  // Extract accurate owner and repo from project.repoUrl, project.owner, project.repoName
  const { owner, repo } = resolveProjectRepoInfo(project);

  let files: any[] = [];
  try {
    files = await giteaService.getAllRepoFilesWithContent(owner, repo, "main");
  } catch (err) {
    console.error(`❌ Failed to fetch files for ${owner}/${repo}:`, err);
  }

  if (!files || files.length === 0) {
    // If repo is not yet pushed, return default template files
    files = [
      {
        path: "README.md",
        name: "README.md",
        size: "1.2 KB",
        language: "markdown",
        content: `# ${project.title}\n\n${project.description || "Academic Capstone Project on GiteaForge"}\n\n## Tech Stack\n${(project.technologies || []).join(", ")}`,
      },
      {
        path: "index.html",
        name: "index.html",
        size: "0.8 KB",
        language: "html",
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${project.title}</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="root">\n    <h1>${project.title}</h1>\n    <p>${project.description || "Welcome to your Gitea repository workspace."}</p>\n  </div>\n  <script src="app.js"></script>\n</body>\n</html>`,
      },
      {
        path: "styles.css",
        name: "styles.css",
        size: "0.4 KB",
        language: "css",
        content: `body {\n  font-family: system-ui, sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n  padding: 2rem;\n}`,
      },
      {
        path: "app.js",
        name: "app.js",
        size: "0.3 KB",
        language: "javascript",
        content: `console.log("Initialized ${project.title}");`,
      },
    ];
  }

  res.status(200).json({ status: "success", data: files });
});

// ── In-App Code Review Commit Diffs & Comments ─────────────────────────────────

export const getCommitDiff = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  const rawSha = req.params["commitSha"];
  const commitSha = (typeof rawSha === "string" ? rawSha : "HEAD").trim();

  await checkProjectAccess(projectId, req.user!, false);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { owner: true },
  });
  if (!project) throw new NotFoundError("Project");

  let owner = project.owner?.giteaUsername || "";
  let repo = project.repoName || "";

  if (project.repoUrl) {
    try {
      const urlClean = project.repoUrl.trim().replace(/\.git$/i, "");
      const urlObj = new URL(urlClean);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      if (segments.length >= 2) {
        owner = segments[segments.length - 2] || owner;
        repo = segments[segments.length - 1] || repo;
      }
    } catch {
      const parts = project.repoUrl.replace(/\.git$/i, "").split("/").filter(Boolean);
      if (parts.length >= 2) {
        const pRepo = parts.pop();
        const pOwner = parts.pop();
        if (pRepo) repo = pRepo;
        if (pOwner) owner = pOwner;
      }
    }
  }

  if (!owner) owner = project.owner?.giteaUsername || project.owner?.name.toLowerCase().replace(/\s+/g, "-") || "user";
  if (!repo) repo = project.repoName || "project-repo";

  let diffData: any = null;
  try {
    diffData = await giteaService.getCommitDiff(owner, repo, commitSha);
  } catch (err) {
    console.warn(`Could not fetch live commit diff for ${owner}/${repo}:`, err);
  }

  if (!diffData || !diffData.files) {
    diffData = {
      sha: commitSha,
      stats: { total: 0, additions: 0, deletions: 0 },
      files: [
        {
          filename: "README.md",
          status: "modified",
          additions: 6,
          deletions: 0,
          patch: `@@ -0,0 +1,6 @@\n+# ${project.title}\n+\n+${project.description || "Academic Capstone Project on GiteaForge"}\n+\n+## Tech Stack\n+${(project.technologies || []).join(", ")}`,
        },
      ],
      recentCommits: [
        {
          sha: "HEAD",
          fullSha: "HEAD",
          message: "Initial workspace synchronization",
          author: project.owner?.name || "Developer",
          date: new Date().toISOString(),
          filesCount: 1,
        },
      ],
    };
  }

  res.status(200).json({ status: "success", data: diffData });
});

export const getCodeReviewComments = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectAccess(projectId, req.user!, false);

  const page = req.query["page"] ? Math.max(1, Number(req.query["page"])) : undefined;
  const limit = req.query["limit"] ? Math.max(1, Math.min(100, Number(req.query["limit"]))) : undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  const comments = await prisma.codeReviewComment.findMany({
    where: { projectId },
    include: {
      author: { select: { id: true, name: true, role: true, department: true } },
    },
    orderBy: { createdAt: "asc" },
    ...(skip !== undefined && { skip }),
    ...(limit !== undefined && { take: limit }),
  });

  const formatted = comments.map((c) => ({
    id: c.id,
    projectId: c.projectId,
    commitSha: c.commitSha,
    filePath: c.filePath,
    lineNumber: c.lineNumber,
    side: c.side,
    content: c.content,
    authorName: c.author.name,
    authorRole: c.author.role,
    createdAt: c.createdAt.toISOString(),
    isResolved: c.isResolved,
  }));

  res.status(200).json({ status: "success", count: formatted.length, data: formatted });
});

export const postCodeReviewComment = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectAccess(projectId, req.user!, false);
  const { commitSha, filePath, lineNumber, side, content } = req.body;

  if (!content?.trim()) throw new BadRequestError("Comment content is required");

  const comment = await prisma.codeReviewComment.create({
    data: {
      projectId,
      commitSha: commitSha || "HEAD",
      filePath: filePath || "src/index.ts",
      lineNumber: lineNumber || 1,
      side: side || "RIGHT",
      content: content.trim(),
      authorId: req.user!.id,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  res.status(201).json({ status: "success", data: comment });
});

export const resolveCodeReviewComment = catchAsync(async (req: Request, res: Response) => {
  const commentId = requireParam(req.params["commentId"], "commentId");
  const comment = await prisma.codeReviewComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError("Comment");
  const project = await checkProjectAccess(comment.projectId, req.user!, false);

  const isAuthor = comment.authorId === req.user!.id;
  const isSupervisor = project.supervisorId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isAuthor && !isSupervisor && !isAdmin) {
    throw new ForbiddenError("Only the comment author, supervisor, or an admin can resolve this comment");
  }

  const { isResolved } = req.body;

  const updated = await prisma.codeReviewComment.update({
    where: { id: commentId },
    data: { isResolved: isResolved ?? true },
  });

  res.status(200).json({ status: "success", data: updated });
});

// ── Threaded Project Feedback ──────────────────────────────────────────────────

export const getProjectFeedback = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectAccess(projectId, req.user!, false);

  const page = req.query["page"] ? Math.max(1, Number(req.query["page"])) : undefined;
  const limit = req.query["limit"] ? Math.max(1, Math.min(100, Number(req.query["limit"]))) : undefined;
  const skip = page && limit ? (page - 1) * limit : undefined;

  const feedbacks = await prisma.projectFeedback.findMany({
    where: { projectId, parentId: null },
    include: {
      author: { select: { id: true, name: true, role: true, department: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, role: true, department: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    ...(skip !== undefined && { skip }),
    ...(limit !== undefined && { take: limit }),
  });

  const formatted = feedbacks.map((f) => ({
    id: f.id,
    projectId: f.projectId,
    author: f.author.name,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.author.name || "User")}`,
    role: f.author.role,
    content: f.content,
    time: f.createdAt.toISOString(),
    resolved: f.isResolved,
    replies: f.replies.map((r) => ({
      id: r.id,
      author: r.author.name,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.author.name || "User")}`,
      role: r.author.role,
      content: r.content,
      time: r.createdAt.toISOString(),
    })),
  }));

  res.status(200).json({ status: "success", count: formatted.length, data: formatted });
});

export const postProjectFeedback = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectAccess(projectId, req.user!, false);
  const { content } = req.body;

  if (!content?.trim()) throw new BadRequestError("Feedback content is required");

  const created = await prisma.projectFeedback.create({
    data: {
      projectId,
      authorId: req.user!.id,
      content: content.trim(),
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      id: created.id,
      author: created.author.name,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(created.author.name || "User")}`,
      role: created.author.role,
      content: created.content,
      time: created.createdAt.toISOString(),
      resolved: false,
      replies: [],
    },
  });
});

export const replyProjectFeedback = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectAccess(projectId, req.user!, false);
  const feedbackId = requireParam(req.params["feedbackId"], "feedbackId");
  const parentFeedback = await prisma.projectFeedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, projectId: true },
  });
  if (!parentFeedback || parentFeedback.projectId !== projectId) {
    throw new BadRequestError("Target feedback does not exist or does not belong to this project");
  }

  const { content } = req.body;

  if (!content?.trim()) throw new BadRequestError("Reply content is required");

  const reply = await prisma.projectFeedback.create({
    data: {
      projectId,
      parentId: feedbackId,
      authorId: req.user!.id,
      content: content.trim(),
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  res.status(201).json({ status: "success", data: reply });
});

export const resolveProjectFeedback = catchAsync(async (req: Request, res: Response) => {
  const feedbackId = requireParam(req.params["feedbackId"], "feedbackId");
  const feedback = await prisma.projectFeedback.findUnique({ where: { id: feedbackId } });
  if (!feedback) throw new NotFoundError("Feedback");
  const project = await checkProjectAccess(feedback.projectId, req.user!, false);

  const isAuthor = feedback.authorId === req.user!.id;
  const isSupervisor = project.supervisorId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  if (!isAuthor && !isSupervisor && !isAdmin) {
    throw new ForbiddenError("Only the feedback author, supervisor, or an admin can resolve this feedback");
  }

  const { resolved } = req.body;

  const updated = await prisma.projectFeedback.update({
    where: { id: feedbackId },
    data: { isResolved: resolved ?? true },
  });

  res.status(200).json({ status: "success", data: updated });
});

// ── Team Members ───────────────────────────────────────────────────────────────

export const getPotentialMembers = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectOwnerOrAdmin(projectId, req.user!);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { batchId: true, ownerId: true },
  });
  if (!project) throw new NotFoundError("Project");

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      id: { not: project.ownerId },
      enrollments: { some: { batchId: project.batchId } },
      NOT: { projectMembers: { some: { projectId } } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      universityId: true,
      department: true,
    },
  });

  res.status(200).json({ status: "success", count: students.length, data: students });
});

export const addProjectMember = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectOwnerOrAdmin(projectId, req.user!);
  const { userId } = req.body;

  if (!userId) throw new BadRequestError("User ID is required");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, batchId: true },
  });
  if (!project) throw new NotFoundError("Project not found");

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      enrollments: { select: { batchId: true } },
    },
  });

  if (!targetUser) throw new NotFoundError("User not found");
  if (targetUser.role !== "STUDENT") {
    throw new BadRequestError("Only students can be added as project team members");
  }

  if (project.batchId) {
    const isEnrolledInBatch = targetUser.enrollments.some((e) => e.batchId === project.batchId);
    if (!isEnrolledInBatch) {
      throw new BadRequestError("Student must be enrolled in the same batch as the project");
    }
  }

  const member = await prisma.projectMember.create({
    data: { projectId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json({ status: "success", data: member });
});

export const removeProjectMember = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  await checkProjectOwnerOrAdmin(projectId, req.user!);
  const userId = requireParam(req.params["userId"], "userId");

  await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  res.status(200).json({ status: "success", message: "Member removed" });
});

export const extendProject = catchAsync(async (req: Request, res: Response) => {
  const id = requireParam(req.params["id"], "id");
  const { title, description, technologies, newBatchId, milestones: customMilestones } = req.body;

  const parent = await prisma.project.findUnique({
    where: { id },
    include: { members: true, milestones: true },
  });

  if (!parent) throw new NotFoundError("Project");
  if (parent.ownerId !== req.user!.id) {
    throw new ForbiddenError("Only project owner can extend the project into a new phase");
  }

  const newPhase = (parent.phase || 1) + 1;
  const newTitle = title || `${parent.title} (Phase ${newPhase})`;

  const extended = await prisma.project.create({
    data: {
      title: newTitle,
      description: description || parent.description || null,
      technologies: technologies || parent.technologies,
      repoName: parent.repoName,
      repoUrl: parent.repoUrl,
      ownerId: parent.ownerId,
      batchId: newBatchId || parent.batchId,
      supervisorId: parent.supervisorId,
      parentProjectId: parent.id,
      phase: newPhase,
      status: "IN_PROGRESS",
    },
    include: projectInclude,
  });

  if (parent.members.length > 0) {
    await prisma.projectMember.createMany({
      data: parent.members.map((m) => ({
        projectId: extended.id,
        userId: m.userId,
      })),
      skipDuplicates: true,
    });
  }

  if (Array.isArray(customMilestones) && customMilestones.length > 0) {
    await prisma.milestone.createMany({
      data: customMilestones.map((m, idx) => ({
        projectId: extended.id,
        title: m.title,
        dueDate: m.due || m.dueDate ? new Date(m.due || m.dueDate) : null,
        order: idx + 1,
        status: idx === 0 ? "IN_PROGRESS" : "PENDING",
      })),
    });
  } else {
    await prisma.milestone.createMany({
      data: [
        {
          projectId: extended.id,
          title: `Phase ${newPhase} Advanced Architecture & Extension Spec`,
          order: 1,
          status: "IN_PROGRESS",
        },
        {
          projectId: extended.id,
          title: `Phase ${newPhase} Core System Implementation`,
          order: 2,
          status: "PENDING",
        },
        {
          projectId: extended.id,
          title: `Phase ${newPhase} Final Evaluation & Capstone Defense`,
          order: 3,
          status: "PENDING",
        },
      ],
    });
  }

  await logActivity({
    type: "PROJECT_EXTENDED",
    payload: { parentTitle: parent.title, newTitle: extended.title, phase: newPhase },
    userId: req.user!.id,
    projectId: extended.id,
  });

  const refreshed = await prisma.project.findUnique({
    where: { id: extended.id },
    include: projectInclude,
  });

  res.status(201).json({ status: "success", data: refreshed });
});

export const commitAndPushSandbox = catchAsync(async (req: Request, res: Response) => {
  const projectId = requireParam(req.params["id"], "id");
  const { files, message, branch } = req.body as {
    files: Array<{ path: string; content: string }>;
    message?: string;
    branch?: string;
  };

  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestError("No workspace files provided for commit");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, giteaUsername: true, name: true } },
      members: {
        include: {
          user: { select: { id: true, giteaUsername: true } },
        },
      },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Check access: user is admin, owner, or team member (supervisors cannot push commits to student repo)
  const isOwner = project.ownerId === req.user!.id;
  const isTeamMember = project.members.some((m) => m.user.id === req.user!.id);
  const isAdmin = req.user!.role === "ADMIN";
  if (!isOwner && !isTeamMember && !isAdmin) {
    throw new ForbiddenError("You do not have permission to push to this project repository");
  }

  // Determine Gitea owner and repo name strictly from the verified project record
  const { owner, repo } = resolveProjectRepoInfo(project);

  if (!owner || !repo) {
    throw new BadRequestError("Project repository is not properly initialized or linked");
  }

  // Prevent path traversal in file paths
  for (const file of files) {
    if (!file.path || file.path.includes("..") || file.path.startsWith("/") || file.path.startsWith("\\")) {
      throw new BadRequestError("Invalid or unsafe file path in workspace files");
    }
  }

  const result = await giteaService.pushWorkspaceFiles(
    owner,
    repo,
    files,
    message || `Update workspace via Sandbox IDE (${new Date().toLocaleDateString()})`,
    branch || "main"
  );

  await logActivity({
    type: "CODE_COMMITTED",
    payload: {
      projectId: project.id,
      projectTitle: project.title,
      filesCommitted: result.committedCount,
      filesIgnored: result.ignoredCount,
      message: result.message,
    },
    userId: req.user!.id,
    projectId: project.id,
  });

  res.status(200).json({
    status: "success",
    message: `Successfully pushed ${result.committedCount} files to Gitea repo (${result.ignoredCount} files ignored via .gitignore)`,
    data: {
      ...result,
      owner,
      repo,
      repoUrl: project.repoUrl,
    },
  });
});
