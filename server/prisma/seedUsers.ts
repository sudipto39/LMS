// prisma/seedUsers.ts
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";

const pool = new pg.Pool({
  connectionString: process.env["DATABASE_URL"],
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding demo users...");

  // Get the first available batch
  const batch = await prisma.batch.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!batch) {
    console.error("❌ No active batch found. Run npm run db:seed first.");
    process.exit(1);
  }

  console.log(`📦 Using batch: ${batch.name}`);

  const hashedStudentPassword = await bcrypt.hash("Student@1234", 12);
  const hashedSupervisorPassword = await bcrypt.hash("Supervisor@1234", 12);
  const hashedAdminPassword = await bcrypt.hash("Admin@1234", 12);

  // ─── Student ──────────────────────────────────────────────────────────────
  const student = await prisma.user.upsert({
    where: { email: "student@lms.com" },
    update: {
      password: hashedStudentPassword,
    },
    create: {
      name: "Demo Student",
      email: "student@lms.com",
      universityId: "LMS2024STUDENT01",
      password: hashedStudentPassword,
      phoneNumber: "9000000001",
      department: "Computer Science",
      role: "STUDENT",
      isEmailVerified: true,
      enrollments: {
        create: { batchId: batch.id },
      },
    },
  });

  console.log(`✅ Student created: ${student.email}`);

  // ─── Supervisor ───────────────────────────────────────────────────────────
  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@lms.com" },
    update: {
      password: hashedSupervisorPassword,
    },
    create: {
      name: "Demo Supervisor",
      email: "supervisor@lms.com",
      universityId: "LMS2024SUPERVISOR01",
      password: hashedSupervisorPassword,
      phoneNumber: "9000000002",
      department: "Computer Science",
      role: "SUPERVISOR",
      isEmailVerified: true,
    },
  });

  console.log(`✅ Supervisor created: ${supervisor.email}`);

  // ─── Admin ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@lms.com" },
    update: {
      password: hashedAdminPassword,
    },
    create: {
      name: "Demo Admin",
      email: "admin@lms.com",
      universityId: "LMS2024ADMIN01",
      password: hashedAdminPassword,
      phoneNumber: "9000000003",
      department: "Administration",
      role: "ADMIN",
      isEmailVerified: true,
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  console.log("\n🎉 Demo users ready!");
  console.log("─────────────────────────────────────");
  console.log("📧 student@lms.com     🔑 Student@1234     role: STUDENT");
  console.log("📧 supervisor@lms.com  🔑 Supervisor@1234  role: SUPERVISOR");
  console.log("📧 admin@lms.com       🔑 Admin@1234       role: ADMIN");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });