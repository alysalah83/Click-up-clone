/*
  Warnings:

  - A unique constraint covering the columns `[id,userId]` on the table `List` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "List_id_userId_key" ON "List"("id", "userId");
