-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_avatarId_fkey";

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "avatarId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "Avatar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
