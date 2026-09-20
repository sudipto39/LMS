// server/prisma/seedGiteaRepos.ts
import dotenv from "dotenv";
dotenv.config();

import axios, { AxiosError } from "axios";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const GITEA_BASE = process.env["GITEA_BASE_URL"] || "http://localhost:3000/api/v1";
const GITEA_TOKEN = process.env["GITEA_ADMIN_TOKEN"] || "";

console.log(`📡 Connecting to Gitea at ${GITEA_BASE}...`);

const gitea = axios.create({
  baseURL: GITEA_BASE,
  headers: {
    Authorization: `token ${GITEA_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env["DATABASE_URL"],
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🔍 Fetching all users and projects from database...");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      giteaUsername: true,
      role: true,
    },
  });

  console.log(`👥 Found ${users.length} users in database.`);

  // 1. Ensure all users exist in Gitea
  for (const u of users) {
    const username = u.giteaUsername || u.email.split("@")[0]!.toLowerCase().replace(/[^a-z0-9]/g, "-");
    try {
      await gitea.post("/admin/users", {
        username,
        email: u.email,
        password: process.env["GITEA_DEFAULT_USER_PASSWORD"] || process.env["SEED_DEFAULT_PASSWORD"] || "StudentPass123!",
        must_change_password: false,
        send_notify: false,
      });
      console.log(`✅ Created Gitea user: @${username} (${u.email})`);
    } catch (err: unknown) {
      if (err instanceof AxiosError && (err.response?.status === 422 || err.response?.status === 409)) {
        console.log(`ℹ️  User already exists in Gitea: @${username}`);
      } else {
        console.warn(`⚠️  Could not create user @${username}:`, (err as any)?.message);
      }
    }
  }

  // 2. Ensure all projects have Gitea repositories
  const projects = await prisma.project.findMany({
    include: {
      owner: {
        select: { id: true, giteaUsername: true, email: true },
      },
    },
  });

  console.log(`\n📦 Found ${projects.length} projects in database.`);

  for (const p of projects) {
    const ownerUsername = p.owner?.giteaUsername || p.owner?.email.split("@")[0]!.toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (!ownerUsername) continue;

    const repoName = p.repoName || p.title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

    try {
      const res = await gitea.post(`/admin/users/${ownerUsername}/repos`, {
        name: repoName,
        description: p.description || p.title,
        private: true,
        auto_init: true,
        default_branch: "main",
      });
      console.log(`✅ Created Gitea repo: ${ownerUsername}/${repoName} (${res.data.html_url})`);
    } catch (err: unknown) {
      if (err instanceof AxiosError && (err.response?.status === 409 || err.response?.status === 422)) {
        console.log(`ℹ️  Repo already exists: ${ownerUsername}/${repoName}`);
      } else {
        console.warn(`⚠️  Could not create repo ${ownerUsername}/${repoName}:`, (err as any)?.message);
      }
    }
  }

  await prisma.$disconnect();
  await pool.end();

  console.log("\n🎉 All Gitea users and repositories are synced and provisioned!");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
