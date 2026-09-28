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
  const signature = req.headers["x-gitea-signature"] as string | undefined;

  if (!signature || !req.body) {
    res.status(401).json({ message: "Invalid signature" });
    return;
  }

  // HMAC-SHA256 verification using timingSafeEqual
  const expected = crypto
    .createHmac("sha256", giteaConfig.webhookSecret)
    .update(req.body as Buffer)
    .digest("hex");

  const cleanSig = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(cleanSig, "utf8");

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
  const cloneUrl = payload.repository?.clone_url as string | undefined;
  const repoName = payload.repository?.name as string | undefined;
  const ownerName = payload.repository?.owner?.username as string | undefined;

  if (!repoUrl && !cloneUrl && !repoName) return;

  const cleanRepoUrl = repoUrl ? repoUrl.replace(/\.git$/i, "").replace(/\/+$/, "") : "";
  const cleanCloneUrl = cloneUrl ? cloneUrl.replace(/\.git$/i, "").replace(/\/+$/, "") : "";

  const project = await prisma.project.findFirst({
    where: {
      OR: [
        ...(cleanRepoUrl ? [{ repoUrl: cleanRepoUrl }, { repoUrl: `${cleanRepoUrl}.git` }] : []),
        ...(cleanCloneUrl ? [{ repoUrl: cleanCloneUrl }, { repoUrl: `${cleanCloneUrl}.git` }] : []),
        ...(repoName && ownerName ? [{ repoName, owner: { giteaUsername: ownerName } }] : []),
      ],
    },
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

  // M-03: Cap commits to 50 — unbounded Promise.all with thousands of commits
  // would exhaust the DB connection pool (application-level DoS)
  const cappedCommits = commits.slice(0, 50);
  if (cappedCommits.length === 0) return;

  // Fetch active project milestones for potential auto-submission
  const milestones = await prisma.milestone.findMany({
    where: { projectId: project.id, isActive: true },
    orderBy: { order: "asc" },
  });

  await Promise.all(
    cappedCommits.map(async (commit) => {
      // 1. Log push activity
      await logActivity({
        type: "PUSH",
        payload: {
          hash: commit.id,
          message: commit.message,
          author: commit.author.name,
          timestamp: commit.timestamp,
          added: commit.added ? commit.added.length : 0,
          modified: commit.modified ? commit.modified.length : 0,
          removed: commit.removed ? commit.removed.length : 0,
        },
        userId: project.ownerId,
        projectId: project.id,
      });

      // 2. Check for milestone references in commit message
      const msg = commit.message.toLowerCase();
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (!m) continue;
        const matchIndex = msg.includes(`milestone ${i + 1}`) || msg.includes(`milestone #${i + 1}`);
        const matchTitle = m.title && msg.includes(m.title.toLowerCase());

        if ((matchIndex || matchTitle) && m.status === "IN_PROGRESS") {
          await prisma.milestone.update({
            where: { id: m.id },
            data: {
              status: "SUBMITTED",
              submittedAt: new Date(),
              submittedById: project.ownerId,
            },
          });

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

// Raw body parser — must come before express.json() in app.ts
router.post(
  "/gitea",
  express.raw({ type: "application/json" }),
  handleGiteaWebhook
);

export default router;