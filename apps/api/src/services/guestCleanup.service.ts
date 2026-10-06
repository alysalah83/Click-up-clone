import { prisma } from "../lib/prisma.js";
import { deleteBlobsBestEffort } from "../lib/blobStorage.js";
import { storedBlobUrls } from "./attachment.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;

/**
 * Deletes up to BATCH_SIZE guest accounts older than `olderThanDays`, with everything they own.
 * Their fake demo teammates (User.demoOwnerId), memberships, assignments and invites go by
 * ON DELETE CASCADE. Rows a guest created inside someone else's workspace are handed to that
 * workspace's owner (lists, statuses) or deleted (tasks), so shared workspaces stay intact.
 */
export async function deleteStaleGuests(olderThanDays = 7, now = new Date()) {
  const cutoff = new Date(now.getTime() - olderThanDays * DAY_MS);
  const guests = await prisma.user.findMany({
    where: { role: "guest", createdAt: { lt: cutoff } },
    select: { id: true },
    take: BATCH_SIZE,
  });
  const userIds = guests.map((guest) => guest.id);
  if (userIds.length === 0) return 0;

  const workspaces = await prisma.workspace.findMany({
    where: { userId: { in: userIds } },
    select: { avatarId: true },
  });
  const byOwner = { userId: { in: userIds } };
  // Uploaded files of everything about to go; seeded demo files are not on the blob store.
  const blobs = await storedBlobUrls({
    OR: [
      { uploaderId: { in: userIds } },
      { task: byOwner },
      { task: { list: { workspace: byOwner } } },
    ],
  });

  // Workspaces cascade to lists, statuses and tasks; workspaces block avatars (RESTRICT).
  await prisma.$transaction([
    prisma.workspace.deleteMany({ where: byOwner }),
    prisma.task.deleteMany({ where: byOwner }),
    prisma.$executeRaw`
      UPDATE "List" l SET "userId" = w."userId"
      FROM "Workspace" w
      WHERE l."workspaceId" = w.id AND l."userId" = ANY(${userIds}) AND w."userId" IS NOT NULL`,
    prisma.$executeRaw`
      UPDATE "Status" s SET "userId" = l."userId"
      FROM "List" l
      WHERE s."listId" = l.id AND s."userId" = ANY(${userIds})`,
    prisma.avatar.deleteMany({ where: { id: { in: workspaces.map((w) => w.avatarId) } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);
  await deleteBlobsBestEffort(blobs);

  return userIds.length;
}
