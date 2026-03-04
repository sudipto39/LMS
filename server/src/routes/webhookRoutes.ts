import { Request, Response } from "express";
import crypto from "crypto";
import { giteaConfig } from "../config/gitea.js";
import { logActivity } from "../services/activityService.js";

export const handleGiteaWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["x-gitea-signature"] as string;

  const expected = crypto
    .createHmac("sha256", giteaConfig.webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expected) {
    return res.status(401).send("Invalid signature");
  }

  const commits = req.body.commits || [];

  for (const commit of commits) {
    await logActivity({
      type: "push",
      message: `${commit.author.name} pushed commit`,
      metadata: {
        commitId: commit.id,
        message: commit.message,
        author: commit.author.name,
      },
    });
  }

  res.status(200).send("Webhook processed");
};