-- CreateEnum
CREATE TYPE "SprintState" AS ENUM ('planned', 'active', 'completed');

-- AlterTable
ALTER TABLE "List" ADD COLUMN "sprintNumber" INTEGER,
ADD COLUMN "sprintStart" TIMESTAMP(3),
ADD COLUMN "sprintEnd" TIMESTAMP(3),
ADD COLUMN "sprintState" "SprintState",
ADD COLUMN "sprintCommittedPoints" INTEGER,
ADD COLUMN "sprintCompletedPoints" INTEGER;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "points" INTEGER,
ADD COLUMN "completedAt" TIMESTAMP(3);
