// src/controllers/giteaController.ts
import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { BadRequestError } from "../utils/appError.js";
import { giteaService } from "../services/giteaService.js";
import { requireParam } from "../utils/requireParam.js";

export const createRepository = catchAsync(
  async (req: Request, res: Response) => {
    const { name, description } = req.body as {
      name: string;
      description?: string;
    };
    if (!name) throw new BadRequestError("Repository name is required");

    const repo = await giteaService.createRepo(
      req.user!.id,
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
    const data = await giteaService.getRepo(owner, repo);
    res.status(200).json({ status: "success", data });
  }
);

export const listCommits = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    const limit = Number(req.query["limit"]) || 20;
    const data = await giteaService.getCommits(owner, repo, limit);
    res.status(200).json({ status: "success", data });
  }
);

export const listBranches = catchAsync(
  async (req: Request, res: Response) => {
    const owner = requireParam(req.params["owner"], "owner");
    const repo = requireParam(req.params["repo"], "repo");
    const data = await giteaService.getBranches(owner, repo);
    res.status(200).json({ status: "success", data });
  }
);