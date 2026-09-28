-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('open', 'active', 'done');

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_statusId_fkey";

-- DropIndex
DROP INDEX "List_id_userId_key";

-- AlterTable
ALTER TABLE "Status" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "StatusType" NOT NULL DEFAULT 'active';

-- Backfill: every list was created with these three built-in statuses.
UPDATE "Status" SET "type" = 'open', "isDefault" = true WHERE "order" = 100;
UPDATE "Status" SET "isDefault" = true WHERE "order" = 200;
UPDATE "Status" SET "type" = 'done', "isDefault" = true WHERE "order" = 100000;

-- CreateIndex
CREATE INDEX "List_workspaceId_idx" ON "List"("workspaceId");

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE INDEX "Status_userId_idx" ON "Status"("userId");

-- CreateIndex
CREATE INDEX "Task_listId_idx" ON "Task"("listId");

-- CreateIndex
CREATE INDEX "Task_statusId_idx" ON "Task"("statusId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Workspace_userId_idx" ON "Workspace"("userId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
