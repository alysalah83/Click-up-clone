-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_statusId_fkey";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE CASCADE ON UPDATE CASCADE;
