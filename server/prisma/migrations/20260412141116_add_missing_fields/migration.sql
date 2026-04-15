/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[repoUrl]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[universityId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endYear` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startYear` to the `batches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "MilestoneStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "endYear" INTEGER NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startYear" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "code" TEXT,
ADD COLUMN     "durationYears" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "school" TEXT;

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "studentNotes" TEXT,
ADD COLUMN     "submittedById" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "technologies" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "department" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "universityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "milestones_projectId_order_idx" ON "milestones"("projectId", "order");

-- CreateIndex
CREATE INDEX "milestones_projectId_status_idx" ON "milestones"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_repoUrl_key" ON "projects"("repoUrl");

-- CreateIndex
CREATE UNIQUE INDEX "users_universityId_key" ON "users"("universityId");

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
