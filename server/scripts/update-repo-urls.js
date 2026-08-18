import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateRepoUrls() {
  console.log("Connecting to Neon database...");
  const projects = await prisma.project.findMany();
  console.log(`Found ${projects.length} projects in database.`);

  for (const project of projects) {
    if (project.repoUrl && project.repoUrl.includes("13.206.9.18")) {
      const updatedUrl = project.repoUrl.replace("https://gitea.13.206.9.18.nip.io", "http://34.93.254.1:3000");
      await prisma.project.update({
        where: { id: project.id },
        data: { repoUrl: updatedUrl },
      });
      console.log(`? Updated project "${project.title}": ${project.repoUrl} -> ${updatedUrl}`);
    }
  }

  console.log("Finished updating repository URLs!");
  await prisma.$disconnect();
  await pool.end();
}

updateRepoUrls().catch(err => {
  console.error("Error updating URLs:", err);
  process.exit(1);
});
