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
    repository?: { name?: string; html_url?: string };
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

  const repoUrl = payload.repository?.html_url;
  if (!repoUrl) return;

  const project = await prisma.project.findFirst({
    where: { repoUrl },
    orderBy: { phase: "desc" },
    select: { id: true, ownerId: true },
  });

  if (!project) return;

  const commits = payload.commits ?? [];
  if (commits.length === 0) return;

  // Fetch active project milestones
  const milestones = await prisma.milestone.findMany({
    where: { projectId: project.id, isActive: true },
    orderBy: { order: "asc" },
  });

  await Promise.all(
    commits.map(async (commit) => {
      // 1. Log push activity
      await logActivity({
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
      });

      // 2. Check for milestone references in commit message
      const msg = commit.message.toLowerCase();
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (!m) continue;
        // Match index like: "milestone 1", "milestone #1", or exact milestone title
        const matchIndex = msg.includes(`milestone ${i + 1}`) || msg.includes(`milestone #${i + 1}`);
        const matchTitle = m.title && msg.includes(m.title.toLowerCase());

        if ((matchIndex || matchTitle) && m.status === "PENDING") {
          await prisma.milestone.update({
            where: { id: m.id },
            data: {
              status: "SUBMITTED",
              submittedAt: new Date(),
              submittedById: project.ownerId,
            },
          });
          console.log(`🚀 Gitea Webhook: Auto-submitted milestone "${m.title}" via commit payload`);

          await logActivity({
            type: "SUBMIT_MILESTONE",
            payload: { milestoneTitle: m.title, viaWebhook: true },
            userId: project.ownerId,
            projectId: project.id,
          });
          break;
        }
      }
    })
  );
};