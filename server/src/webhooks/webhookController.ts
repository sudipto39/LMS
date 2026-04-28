// src/webhooks/webhookController.ts
import crypto from "crypto";
import type { Request, Response } from "express";
import { giteaConfig } from "../config/gitea.js";
import { logActivity } from "../services/activityService.js";

export const handleGiteaWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const signature = req.headers["x-gitea-signature"] as string | undefined;

  const expected = crypto
    .createHmac("sha256", giteaConfig.webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (!signature || signature !== expected) {
    res.status(401).send("Invalid signature");
    return;
  }

  const commits = (req.body as { commits?: Array<{
    id: string;
    message: string;
    author: { name: string };
  }> }).commits ?? [];

  for (const commit of commits) {
    await logActivity({
      type: "PUSH",
      payload: {
        commitId: commit.id,
        message: commit.message,
        author: commit.author.name,
      },
    });
  }

  res.status(200).send("Webhook processed");
};