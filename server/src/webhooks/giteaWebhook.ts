// src/webhooks/giteaWebhook.ts
import crypto from "crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { giteaConfig } from "../config/gitea.js";
import { logActivity } from "../services/activityService.js";

const verifySignature = (rawBody: Buffer, signature: string): boolean => {
  const expected = crypto
    .createHmac("sha256", giteaConfig.webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(`sha256=${expected}`, "utf8");
  const actualBuf = Buffer.from(signature ?? "", "utf8");

  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
};

export const handleGiteaWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const signature = req.headers["x-gitea-signature"] as string | undefined;

  if (!signature || !verifySignature(req.body as Buffer, signature)) {
    res.status(401).json({ message: "Invalid signature" });
    return;
  }

  // Respond immediately — process async
  res.status(200).json({ received: true });

  const event = req.headers["x-gitea-event"] as string;
  if (event !== "push") return;

  const payload = JSON.parse((req.body as Buffer).toString()) as {
    repository?: { name?: string };
    commits?: Array<{
      id: string;
      message: string;
      author: { name: string };
      added: string[];
      modified: string[];
      removed: string[];
      timestamp: string;
    }>;
  };

  const repoName = payload.repository?.name;
  if (!repoName) return;

  const project = await prisma.project.findUnique({
    where: { repoName },
    select: { id: true, ownerId: true },
  });

  if (!project) return;

  const commits = payload.commits ?? [];
  if (commits.length === 0) return;

  await Promise.all(
    commits.map((commit) =>
      logActivity({
        type: "PUSH",
        payload: {
          hash: commit.id,
          message: commit.message,
          author: commit.author.name,
          timestamp: commit.timestamp,
          added: commit.added.length,
          modified: commit.modified.length,
          removed: commit.removed.length,
        },
        userId: project.ownerId,
        projectId: project.id,
      })
    )
  );
};