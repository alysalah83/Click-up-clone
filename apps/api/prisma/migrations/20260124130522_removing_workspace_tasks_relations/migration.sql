/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_workspaceId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "workspaceId";
