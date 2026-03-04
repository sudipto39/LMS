import { Request, Response } from "express";
import Project from "../models/projectModel.js";
import { logActivity } from "../services/activityService.js";

export const handleGiteaWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const repoUrl = payload.repository?.clone_url;

    if (!repoUrl) {
      return res.status(200).send("No repo info");
    }

    const project = await Project.findOne({ repoUrl });

    if (!project) {
      return res.status(200).send("Project not found");
    }

    const commits = payload.commits || [];

    for (const commit of commits) {
      await logActivity({
        project: project._id,
        type: "push",
        message: `${commit.author.name} pushed commit`,
        metadata: {
          commitId: commit.id,
          message: commit.message,
          author: commit.author.name,
          branch: payload.ref,
          timestamp: commit.timestamp,
        },
      });
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error(error);
    res.status(500).send("Webhook failed");
  }
};