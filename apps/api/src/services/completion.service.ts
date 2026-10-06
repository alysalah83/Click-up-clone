import { prisma } from "../lib/prisma.js";

/**
 * Keeps `completedAt` in step with the status type: stamped when a task enters a done-type
 * status, cleared when it leaves one. Call after any status change.
 */
export async function syncCompletedAt(taskIds: string[], now = new Date()) {
  if (taskIds.length === 0) return;
  await prisma.task.updateMany({
    where: { id: { in: taskIds }, completedAt: null, status: { type: "done" } },
    data: { completedAt: now },
  });
  await prisma.task.updateMany({
    where: { id: { in: taskIds }, completedAt: { not: null }, status: { type: { not: "done" } } },
    data: { completedAt: null },
  });
}
