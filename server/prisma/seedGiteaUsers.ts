import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const GITEA_BASE = process.env["GITEA_BASE_URL"]!;
const GITEA_TOKEN = process.env["GITEA_ADMIN_TOKEN"]!;

const gitea = axios.create({
  baseURL: GITEA_BASE,
  headers: {
    Authorization: `token ${GITEA_TOKEN}`,
    "Content-Type": "application/json",
  },
});

interface GiteaUserPayload {
  username: string;
  email: string;
  password: string;
  must_change_password: boolean;
  send_notify: boolean;
}

const createGiteaUser = async (payload: GiteaUserPayload) => {
  try {
    const res = await gitea.post("/admin/users", payload);
    console.log(`✅ Gitea user created: ${payload.username}`);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 422) {
      console.log(`⚠️  User already exists in Gitea: ${payload.username}`);
      return null;
    }
    throw err;
  }
};

async function main() {
  console.log("🔧 Creating Gitea accounts for demo users...\n");

  // Student
  await createGiteaUser({
    username: "student",
    email: "student@lms.com",
    password: "Student@1234",
    must_change_password: false,
    send_notify: false,
  });

  // Supervisor
  await createGiteaUser({
    username: "supervisor",
    email: "supervisor@lms.com",
    password: "Supervisor@1234",
    must_change_password: false,
    send_notify: false,
  });

  // Admin
  await createGiteaUser({
    username: "admin-lms",
    email: "admin@lms.com",
    password: "Admin@1234",
    must_change_password: false,
    send_notify: false,
  });

  console.log("\n✅ Done! Now updating giteaUsername in PostgreSQL...");

  // Update giteaUsername in DB
  const { PrismaClient } = await import("../src/generated/prisma/index.js");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pg = await import("pg");

  const pool = new pg.default.Pool({
    connectionString: process.env["DATABASE_URL"],
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.user.update({
    where: { email: "student@lms.com" },
    data: { giteaUsername: "student" },
  });
  console.log("✅ student@lms.com → giteaUsername: student");

  await prisma.user.update({
    where: { email: "supervisor@lms.com" },
    data: { giteaUsername: "supervisor" },
  });
  console.log("✅ supervisor@lms.com → giteaUsername: supervisor");

  await prisma.user.update({
    where: { email: "admin@lms.com" },
    data: { giteaUsername: "admin-lms" },
  });
  console.log("✅ admin@lms.com → giteaUsername: admin-lms");

  await prisma.$disconnect();
  await pool.end();

  console.log("\n🎉 All done! Summary:");
  console.log("─────────────────────────────────────────────");
  console.log("📧 student@lms.com     → Gitea: student");
  console.log("📧 supervisor@lms.com  → Gitea: supervisor");
  console.log("📧 admin@lms.com       → Gitea: admin-lms");
  console.log("─────────────────────────────────────────────");
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});