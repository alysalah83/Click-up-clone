/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `Status` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[listId,name]` on the table `Status` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `listId` to the `Status` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Status" DROP CONSTRAINT "Status_workspaceId_fkey";

-- DropIndex
DROP INDEX "Status_workspaceId_name_key";

-- AlterTable
ALTER TABLE "Status" DROP COLUMN "workspaceId",
ADD COLUMN     "listId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Status_listId_name_key" ON "Status"("listId", "name");

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
