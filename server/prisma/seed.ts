// // prisma/seed.ts
// import dotenv from "dotenv";
// dotenv.config();

// import { PrismaClient } from "../src/generated/prisma/index.js";
// import { PrismaPg } from "@prisma/adapter-pg";
// import pg from "pg";

// const pool = new pg.Pool({
//   connectionString: process.env["DATABASE_URL"],
// });

// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// async function main() {
//   console.log("🌱 Seeding database...");

//   // Create courses
//   const cse = await prisma.course.upsert({
//     where: { code: "BTCSE" },
//     update: {},
//     create: {
//       title: "B.Tech Computer Science & Engineering",
//       code: "BTCSE",
//       school: "School of Engineering",
//       durationYears: 4,
//     },
//   });

//   const ece = await prisma.course.upsert({
//     where: { code: "BTECE" },
//     update: {},
//     create: {
//       title: "B.Tech Electronics & Communication",
//       code: "BTECE",
//       school: "School of Engineering",
//       durationYears: 4,
//     },
//   });

//   console.log("✅ Courses created:", cse.title, "|", ece.title);

//   // Create batches for CSE
//   const batch2023 = await prisma.batch.upsert({
//     where: { name: "CSE 2023-2027" },
//     update: {},
//     create: {
//       name: "CSE 2023-2027",
//       courseId: cse.id,
//       startYear: 2023,
//       endYear: 2027,
//     },
//   });

//   const batch2022 = await prisma.batch.upsert({
//     where: { name: "CSE 2022-2026" },
//     update: {},
//     create: {
//       name: "CSE 2022-2026",
//       courseId: cse.id,
//       startYear: 2022,
//       endYear: 2026,
//     },
//   });

//   const batch2024 = await prisma.batch.upsert({
//     where: { name: "CSE 2024-2028" },
//     update: {},
//     create: {
//       name: "CSE 2024-2028",
//       courseId: cse.id,
//       startYear: 2024,
//       endYear: 2028,
//     },
//   });

//   // Create batch for ECE
//   const batchEce2023 = await prisma.batch.upsert({
//     where: { name: "ECE 2023-2027" },
//     update: {},
//     create: {
//       name: "ECE 2023-2027",
//       courseId: ece.id,
//       startYear: 2023,
//       endYear: 2027,
//     },
//   });

//   console.log("✅ Batches created:", batch2022.name, "|", batch2023.name, "|", batch2024.name, "|", batchEce2023.name);

//   // Create admin user
//   const bcrypt = await import("bcrypt");
//   const hashedPassword = await bcrypt.hash("Admin@1234", 12);

//   const admin = await prisma.user.upsert({
//     where: { email: "admin@giteaforge.com" },
//     update: {},
//     create: {
//       name: "System Admin",
//       email: "admin@giteaforge.com",
//       universityId: "ADMIN001",
//       password: hashedPassword,
//       phoneNumber: "0000000000",
//       department: "Administration",
//       role: "ADMIN",
//       isEmailVerified: true,
//     },
//   });

//   console.log("✅ Admin created:", admin.email);
//   console.log("🎉 Seeding complete!");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seed failed:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//     await pool.end();
//   });

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

// ─── Course definitions ───────────────────────────────────────────────────────
const COURSES = [
  {
    title: "B.Tech CSE (Cyber Security)",
    code: "BTCSE-CS",
    school: "School of Engineering & Technology",
    durationYears: 4,
    description: "B.Tech in Computer Science & Engineering with specialization in Cyber Security",
  },
  {
    title: "B.Tech CSE (AIML)",
    code: "BTCSE-AIML",
    school: "School of Engineering & Technology",
    durationYears: 4,
    description: "B.Tech in Computer Science & Engineering with specialization in AI & ML",
  },
  {
    title: "B.Tech CSE (Data Science)",
    code: "BTCSE-DS",
    school: "School of Engineering & Technology",
    durationYears: 4,
    description: "B.Tech in Computer Science & Engineering with specialization in Data Science",
  },
  // {
  //   title: "B.Tech CSE (General)",
  //   code: "BTCSE-GEN",
  //   school: "School of Engineering & Technology",
  //   durationYears: 4,
  //   description: "B.Tech in Computer Science & Engineering",
  // },
  {
    title: "BCA",
    code: "BCA",
    school: "School of Computer Applications",
    durationYears: 3,
    description: "Bachelor of Computer Applications",
  },
];

// ─── Batch year ranges ────────────────────────────────────────────────────────
const BATCH_YEARS = [
  { startYear: 2022, endYear: 2026 },
  { startYear: 2023, endYear: 2027 },
  { startYear: 2024, endYear: 2028 },
  { startYear: 2025, endYear: 2029 },
  
];

async function main() {
  console.log("🌱 Seeding courses and batches...\n");

  // Delete existing data in correct order
  await prisma.batchEnrollment.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.course.deleteMany();
  console.log("🗑️  Cleared existing courses and batches\n");

  const createdBatches: Array<{ id: string; name: string }> = [];

  for (const courseData of COURSES) {
    // Create course
    const course = await prisma.course.create({
      data: courseData,
    });
    console.log(`✅ Course: ${course.title}`);

    // Create batches for this course
    for (const { startYear, endYear } of BATCH_YEARS) {
      const batchName = `${course.title} (${startYear}–${endYear})`;

      const batch = await prisma.batch.create({
        data: {
          name: batchName,
          courseId: course.id,
          startYear,
          endYear,
          isActive: true,
        },
      });

      createdBatches.push({ id: batch.id, name: batch.name });
      console.log(`   📦 Batch: ${batch.name}`);
    }
    console.log();
  }

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@giteaforge.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@giteaforge.com",
      universityId: "ADMIN001",
      password: adminPassword,
      phoneNumber: "0000000000",
      department: "Administration",
      role: "ADMIN",
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n🎉 Seeding complete!");
  console.log("─────────────────────────────────────────────────────────────");
  console.log(`📚 Courses created: ${COURSES.length}`);
  console.log(`📦 Batches created: ${createdBatches.length}`);
  console.log("\nBatch names:");
  createdBatches.forEach((b) => console.log(`  • ${b.name}`));
  console.log("─────────────────────────────────────────────────────────────");
  console.log("📧 admin@giteaforge.com  🔑 Admin@1234");
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
