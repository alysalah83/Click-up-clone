-- CreateTable
CREATE TABLE "Doc" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Doc_workspaceId_parentId_idx" ON "Doc"("workspaceId", "parentId");

-- CreateIndex
CREATE INDEX "Doc_createdById_idx" ON "Doc"("createdById");

-- AddForeignKey
ALTER TABLE "Doc" ADD CONSTRAINT "Doc_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doc" ADD CONSTRAINT "Doc_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doc" ADD CONSTRAINT "Doc_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
