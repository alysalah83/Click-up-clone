import { prisma } from "../lib/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;

/** Deletes up to BATCH_SIZE guest accounts older than `olderThanDays`, with everything they own. */
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

  // Children first: tasks block status deletion (NO ACTION), workspaces block avatars (RESTRICT).
  await prisma.$transaction([
    prisma.task.deleteMany({ where: byOwner }),
    prisma.status.deleteMany({ where: byOwner }),
    prisma.list.deleteMany({ where: byOwner }),
    prisma.workspace.deleteMany({ where: byOwner }),
    prisma.avatar.deleteMany({ where: { id: { in: workspaces.map((w) => w.avatarId) } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);

  return userIds.length;
}
