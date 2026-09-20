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

  const oldUrl = process.env.OLD_GITEA_URL;
  const newUrl = process.env.NEW_GITEA_URL || process.env.GITEA_BASE_URL?.replace("/api/v1", "");

  if (!oldUrl || !newUrl) {
    console.log("ℹ️  Skipping repo URL updates: OLD_GITEA_URL and NEW_GITEA_URL must be specified in environment.");
    return;
  }

  for (const project of projects) {
    if (project.repoUrl && project.repoUrl.includes(oldUrl)) {
      const updatedUrl = project.repoUrl.replace(oldUrl, newUrl);
      await prisma.project.update({
        where: { id: project.id },
        data: { repoUrl: updatedUrl },
      });
      console.log(`✅ Updated project "${project.title}": ${project.repoUrl} -> ${updatedUrl}`);
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
