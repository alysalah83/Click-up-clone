/*
  Warnings:

  - You are about to drop the column `workSpaceId` on the `List` table. All the data in the column will be lost.
  - Added the required column `workspaceId` to the `List` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "List" DROP CONSTRAINT "List_workSpaceId_fkey";

-- AlterTable
ALTER TABLE "List" DROP COLUMN "workSpaceId",
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
