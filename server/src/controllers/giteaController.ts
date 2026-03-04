import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import * as giteaService from "../services/giteaService.js";

export const createRepository = catchAsync(
  async (req: Request, res: Response) => {
    const { name } = req.body;

    const repo = await giteaService.createRepo(name);

    res.status(201).json({
      status: "success",
      data: repo,
    });
  },
);

export const getRepository = catchAsync(async (req: Request, res: Response) => {
  const { owner, repo } = req.params;

  if (typeof owner !== "string" || typeof repo !== "string") {
    throw new AppError("Invalid repository parameters", 400);
  }

  const repoData = await giteaService.getRepo(owner, repo);

  res.status(200).json({
    status: "success",
    data: repoData,
  });
});

export const listCommits = catchAsync(async (req: Request, res: Response) => {
  const { owner, repo } = req.params;

  if (typeof owner !== "string" || typeof repo !== "string") {
    throw new AppError("Invalid repository parameters", 400);
  }

  const commits = await giteaService.getRepoCommits(owner, repo);

  res.status(200).json({
    status: "success",
    data: commits,
  });
});

export const listBranches = catchAsync(
  async (req: Request, res: Response) => {
    const { owner, repo } = req.params as { owner: string; repo: string };

    const branches = await giteaService.getBranches(owner, repo);

    res.status(200).json({
      status: "success",
      data: branches,
    });
  }
);
