// src/routes/webhookRoutes.ts
import { Router } from "express";
import express from "express";
import crypto from "crypto";
import type { Request, Response } from "express";
import { giteaConfig } from "../config/gitea.js";
import { prisma } from "../config/db.js";
import { logActivity } from "../services/activityService.js";

const router = Router();

const handleGiteaWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const signature = req.headers["x-gitea-signature"] as string;

  // HMAC-SHA256 verification using timingSafeEqual
  const expected = crypto
    .createHmac("sha256", giteaConfig.webhookSecret)
    .update(req.body as Buffer)
    .digest("hex");

  const expectedBuf = Buffer.from(`sha256=${expected}`, "utf8");
  const actualBuf = Buffer.from(signature ?? "", "utf8");

  const isValid =
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!isValid) {
    res.status(401).json({ message: "Invalid signature" });
    return;
  }

  // Respond immediately — process async
  res.status(200).json({ received: true });

  const event = req.headers["x-gitea-event"] as string;

  if (event !== "push") return;

  let payload: any;
  try {
    const rawBody = (req.body as Buffer).toString();
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("❌ Failed to parse Gitea webhook payload:", err);
    return;
  }
  const repoUrl = payload.repository?.html_url as string | undefined;

  if (!repoUrl) return;

  const project = await prisma.project.findFirst({
    where: { repoUrl },
    orderBy: { phase: "desc" },
    select: { id: true, ownerId: true },
  });

  if (!project) return;

  const commits: Array<{
    id: string;
    message: string;
    author: { name: string };
    added: string[];
    modified: string[];
    removed: string[];
    timestamp: string;
  }> = payload.commits ?? [];

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

// Raw body parser — must come before express.json() in app.ts
router.post(
  "/gitea",
  express.raw({ type: "application/json" }),
  handleGiteaWebhook
);

export default router;