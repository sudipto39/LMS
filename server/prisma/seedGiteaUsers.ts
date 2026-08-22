import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const GITEA_BASE = process.env["GITEA_BASE_URL"] || "http://localhost:3000/api/v1";
const GITEA_TOKEN = process.env["GITEA_ADMIN_TOKEN"] || "";

const gitea = axios.create({
  baseURL: GITEA_BASE,
  headers: {
    Authorization: `token ${GITEA_TOKEN}`,
    "Content-Type": "application/json",
  },
  timeout: 5000,
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
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 422) {
        console.log(`⚠️  User already exists in Gitea: ${payload.username}`);
        return null;
      }
      console.warn(`⚠️  Gitea API returned ${err.response?.status} for ${payload.username}: ${err.message}`);
      return null;
    }
    console.warn(`⚠️  Failed to connect to Gitea for ${payload.username}:`, err);
    return null;
  }
};

async function main() {
  console.log("🔧 Creating Gitea accounts for demo users...\n");

  const users = [
    // Supervisors
    { username: "rajesh-sharma", email: "rajesh.sharma@lms.com", password: "Supervisor@1234" },
    { username: "ananya-roy", email: "ananya.roy@lms.com", password: "Supervisor@1234" },
    { username: "supervisor", email: "supervisor@lms.com", password: "Supervisor@1234" },

    // Students
    { username: "rahul-verma", email: "rahul.verma@lms.com", password: "Student@1234" },
    { username: "priya-patel", email: "priya.patel@lms.com", password: "Student@1234" },
    { username: "amit-kumar", email: "amit.kumar@lms.com", password: "Student@1234" },
    { username: "sneha-das", email: "sneha.das@lms.com", password: "Student@1234" },
    { username: "vikram-singh", email: "vikram.singh@lms.com", password: "Student@1234" },
    { username: "neha-gupta", email: "neha.gupta@lms.com", password: "Student@1234" },
    { username: "rohan-mehta", email: "rohan.mehta@lms.com", password: "Student@1234" },
    { username: "tanvi-sharma", email: "tanvi.sharma@lms.com", password: "Student@1234" },
    { username: "student", email: "student@lms.com", password: "Student@1234" },

    // Admin
    { username: "admin-lms", email: "admin@lms.com", password: "Admin@1234" },
  ];

  for (const user of users) {
    await createGiteaUser({
      username: user.username,
      email: user.email,
      password: user.password,
      must_change_password: false,
      send_notify: false,
    });
  }

  console.log("\n✅ Updating giteaUsername mapping in PostgreSQL...");

  const { PrismaClient } = await import("../src/generated/prisma/index.js");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const pg = await import("pg");

  const pool = new pg.default.Pool({
    connectionString: process.env["DATABASE_URL"],
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  for (const user of users) {
    try {
      await prisma.user.updateMany({
        where: { email: user.email },
        data: { giteaUsername: user.username },
      });
      console.log(`✅ ${user.email} → giteaUsername: ${user.username}`);
    } catch (err) {
      console.warn(`⚠️ Could not update user ${user.email} in DB:`, err);
    }
  }

  await prisma.$disconnect();
  await pool.end();

  console.log("\n🎉 Gitea seeding complete!");
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});