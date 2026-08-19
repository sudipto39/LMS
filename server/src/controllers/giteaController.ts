// src/controllers/giteaController.ts
import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { BadRequestError, ForbiddenError } from "../utils/appError.js";
import { giteaService } from "../services/giteaService.js";
import { requireParam } from "../utils/requireParam.js";
import { prisma } from "../config/db.js";

async function verifyRepoAccess(
  req: Request,
  owner: string,
  repo: string,
  writeMode = false
): Promise<void> {
  const user = req.user;
  if (!user) throw new ForbiddenError("Authentication required");
  if (user.role === "ADMIN") return;

  // If user is direct owner of the repo in Gitea
  const isDirectOwner =
    Boolean(user.giteaUsername) &&
    user.giteaUsername?.toLowerCase() === owner.toLowerCase();

  if (isDirectOwner) return;

  // Otherwise, find the project in the database
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { repoName: repo },
        { repoUrl: { contains: `${owner}/${repo}` } },
      ],
    },
    include: {
      owner: { select: { id: true, giteaUsername: true } },
      members: { select: { userId: true } },
    },
  });

  if (!project) {
    throw new ForbiddenError("You do not have permission to access this repository");
  }

  const isProjectOwner = project.ownerId === user.id;
  const isMember = project.members?.some((m) => m.userId === user.id) ?? false;
  const isSupervisor = project.supervisorId === user.id;

  if (writeMode) {
    if (!isProjectOwner && !isMember) {
      throw new ForbiddenError("You do not have permission to modify files in this repository");
    }
  } else {
    if (!isProjectOwner && !isMember && !isSupervisor) {
      throw new ForbiddenError("You do not have permission to access this repository");
    }
  }
}

export const createRepository = catchAsync(
  async (req: Request, res: Response) => {
    const { name, description } = req.body as {
      name: string;
      description?: string;
    };
    if (!name) throw new BadRequestError("Repository name is required");

    if (!req.user!.giteaUsername) {
      throw new BadRequestError("Gitea account not linked. Please contact admin.");
    }
    const repo = await giteaService.createRepo(
      req.user!.giteaUsername,
      name,
      description
    );
    res.status(201).json({ status: "success", data: repo });
  }
);

export const getRepository = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    await verifyRepoAccess(req, owner, repo, false);

    const data = await giteaService.getRepo(owner, repo);
    res.status(200).json({ status: "success", data });
  }
);

export const listCommits = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    await verifyRepoAccess(req, owner, repo, false);

    const limit = Number(req.query["limit"]) || 20;
    const data = await giteaService.getCommits(owner, repo, limit);
    res.status(200).json({ status: "success", data });
  }
);

export const listBranches = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    await verifyRepoAccess(req, owner, repo, false);

    const data = await giteaService.getBranches(owner, repo);
    res.status(200).json({ status: "success", data });
  }
);

export const getRepoCommits = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    await verifyRepoAccess(req, owner, repo, false);

    const commits = await giteaService.getCommits(owner, repo);
    res.status(200).json({ status: "success", data: commits });
  }
);

export const listContents = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    await verifyRepoAccess(req, owner, repo, false);

    const path = (req.query["path"] as string) || "";
    const data = await giteaService.getRepoContents(owner, repo, path);
    res.status(200).json({ status: "success", data });
  }
);

export const updateFile = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    await verifyRepoAccess(req, owner, repo, true);

    const { filepath, content, message } = req.body as {
      filepath: string;
      content: string;
      message?: string;
    };
    if (!filepath || content === undefined) {
      throw new BadRequestError("Filepath and content are required");
    }
    const data = await giteaService.updateRepoFile(
      owner,
      repo,
      filepath,
      content,
      message
    );
    res.status(200).json({ status: "success", data });
  }
);