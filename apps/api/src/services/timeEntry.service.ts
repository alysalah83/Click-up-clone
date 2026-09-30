import type { CreateManualTimeEntryInput, TaskTimeDto, TimeEntryDto } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess } from "./access.service.js";
import { logActivity } from "./activity.service.js";

const entrySelect = {
  id: true,
  taskId: true,
  userId: true,
  startedAt: true,
  endedAt: true,
  durationSec: true,
  user: { select: { id: true, name: true, email: true, avatarColor: true } },
} as const;

const ENTRIES_LIMIT = 100;

/** Whole seconds between two instants, never negative. */
export function durationSeconds(startedAt: Date, endedAt: Date) {
  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
}

const toDto = <T extends { startedAt: Date; endedAt: Date | null }>(entry: T) => ({
  ...entry,
  startedAt: entry.startedAt.toISOString(),
  endedAt: entry.endedAt?.toISOString() ?? null,
});

/** Stops every running timer of the user (there is at most one, but be safe) and logs the time. */
async function stopRunning(userId: string, now: Date) {
  const running = await prisma.timeEntry.findMany({
    where: { userId, endedAt: null },
    select: { id: true, taskId: true, startedAt: true },
  });
  for (const entry of running) {
    const durationSec = durationSeconds(entry.startedAt, now);
    await prisma.timeEntry.update({ where: { id: entry.id }, data: { endedAt: now, durationSec } });
    await logActivity([{ taskId: entry.taskId, actorId: userId, type: "time_logged", data: { durationSec } }]);
  }
}

/** The task's entries (newest first), the total of finished time, and the caller's running timer. */
export async function getTaskTime(userId: string, taskId: string): Promise<TaskTimeDto> {
  await assertCanAccess(userId, { taskId });
  const [entries, total, running] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { taskId },
      orderBy: { startedAt: "desc" },
      take: ENTRIES_LIMIT,
      select: entrySelect,
    }),
    prisma.timeEntry.aggregate({ where: { taskId, endedAt: { not: null } }, _sum: { durationSec: true } }),
    prisma.timeEntry.findFirst({
      where: { userId, endedAt: null },
      select: { ...entrySelect, task: { select: { name: true } } },
    }),
  ]);
  return {
    entries: entries.map(toDto),
    totalSec: total._sum.durationSec ?? 0,
    running: running ? { ...toDto(running), taskName: running.task.name } : null,
  };
}

/** Starts a timer on the task. A timer already running (on any task) is stopped first. */
export async function startTimer(userId: string, taskId: string, now = new Date()): Promise<TimeEntryDto> {
  await assertCanAccess(userId, { taskId });
  await stopRunning(userId, now);
  const entry = await prisma.timeEntry.create({
    data: { taskId, userId, startedAt: now },
    select: entrySelect,
  });
  return toDto(entry);
}

export async function stopTimer(userId: string, entryId: string, now = new Date()): Promise<TimeEntryDto> {
  const entry = await prisma.timeEntry.findFirst({ where: { id: entryId, userId }, select: entrySelect });
  if (!entry) throw new NotFoundError("Time entry not found");
  if (entry.endedAt) return toDto(entry);
  const durationSec = durationSeconds(entry.startedAt, now);
  const stopped = await prisma.timeEntry.update({
    where: { id: entryId },
    data: { endedAt: now, durationSec },
    select: entrySelect,
  });
  await logActivity([{ taskId: entry.taskId, actorId: userId, type: "time_logged", data: { durationSec } }]);
  return toDto(stopped);
}

/** Adds finished time ("I worked 1h 30m"): an entry that ends now and lasts `durationSec`. */
export async function addManualEntry(
  userId: string,
  { taskId, durationSec }: CreateManualTimeEntryInput,
  now = new Date(),
): Promise<TimeEntryDto> {
  await assertCanAccess(userId, { taskId });
  const entry = await prisma.timeEntry.create({
    data: { taskId, userId, startedAt: new Date(now.getTime() - durationSec * 1000), endedAt: now, durationSec },
    select: entrySelect,
  });
  await logActivity([{ taskId, actorId: userId, type: "time_logged", data: { durationSec } }]);
  return toDto(entry);
}

/** Members delete their own entries; workspace admins can delete anyone's. */
export async function deleteEntry(userId: string, entryId: string) {
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId }, select: { taskId: true, userId: true } });
  if (!entry) throw new NotFoundError("Time entry not found");
  await assertCanAccess(userId, { taskId: entry.taskId }, entry.userId === userId ? "guest" : "admin");
  await prisma.timeEntry.delete({ where: { id: entryId } });
}
