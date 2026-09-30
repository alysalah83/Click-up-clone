import { prisma } from "../lib/prisma.js";
import { assertCanAccess, inMyWorkspaces } from "./access.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BURNDOWN_DAYS = 14;

/**
 * Tasks have no completion timestamp: a done task counts as completed at its latest
 * status-change activity into its current status, else at its `updatedAt`.
 */
async function completionTimes(tasks: { id: string; updatedAt: Date; status: { name: string } }[]) {
  const activities = tasks.length
    ? await prisma.activity.findMany({
        where: { taskId: { in: tasks.map((t) => t.id) }, type: "status" },
        select: { taskId: true, createdAt: true, data: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const found = new Map<string, Date>();
  for (const a of activities) {
    const to = (a.data as { to?: unknown } | null)?.to;
    if (to === byId.get(a.taskId)?.status.name) found.set(a.taskId, a.createdAt);
  }
  return new Map(tasks.map((t) => [t.id, found.get(t.id) ?? t.updatedAt]));
}

/** Tracked seconds of an entry; a running timer counts up to `now`. */
export function trackedSeconds(entry: { startedAt: Date; endedAt: Date | null; durationSec: number | null }, now: Date) {
  if (entry.endedAt) return entry.durationSec ?? 0;
  return Math.max(0, Math.round((now.getTime() - entry.startedAt.getTime()) / 1000));
}

/** Time tracked in the last 7 days on tasks of the user's workspaces: the total and per member (highest first). */
async function timeTracked(userId: string, now: Date) {
  const entries = await prisma.timeEntry.findMany({
    where: { startedAt: { gte: new Date(now.getTime() - 7 * DAY_MS) }, task: inMyWorkspaces(userId) },
    select: {
      startedAt: true,
      endedAt: true,
      durationSec: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  const byMember = new Map<string, { name: string; seconds: number }>();
  let total = 0;
  for (const entry of entries) {
    const seconds = trackedSeconds(entry, now);
    total += seconds;
    const row = byMember.get(entry.user.id) ?? { name: entry.user.name ?? entry.user.email ?? "Member", seconds: 0 };
    row.seconds += seconds;
    byMember.set(entry.user.id, row);
  }
  return {
    timeTrackedThisWeekSec: total,
    timeByMember: [...byMember.values()].sort((a, b) => b.seconds - a.seconds),
  };
}

export async function summary(userId: string, now = new Date()) {
  const tasks = await prisma.task.findMany({
    where: { ...inMyWorkspaces(userId), parentTaskId: null },
    select: {
      id: true,
      endDate: true,
      updatedAt: true,
      status: { select: { name: true, type: true } },
      assignees: { select: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const done = tasks.filter((t) => t.status.type === "done");
  const times = await completionTimes(done);
  const weekAgo = now.getTime() - 7 * DAY_MS;

  const overdue = tasks.filter((t) => t.status.type !== "done" && t.endDate && t.endDate < startOfToday).length;
  const completedThisWeek = done.filter((t) => times.get(t.id)!.getTime() >= weekAgo).length;

  const workload = new Map<string, { name: string; open: number; done: number }>();
  for (const t of tasks) {
    const owners = t.assignees.length
      ? t.assignees.map((a) => ({ id: a.user.id, name: a.user.name ?? a.user.email ?? "Member" }))
      : [{ id: "unassigned", name: "Unassigned" }];
    for (const o of owners) {
      const row = workload.get(o.id) ?? { name: o.name, open: 0, done: 0 };
      row[t.status.type === "done" ? "done" : "open"]++;
      workload.set(o.id, row);
    }
  }

  const categories = { open: 0, active: 0, done: 0 };
  for (const t of tasks) categories[t.status.type]++;

  return {
    ...(await timeTracked(userId, now)),
    total: tasks.length,
    overdue,
    completedThisWeek,
    workload: [...workload.values()].sort((a, b) => b.open + b.done - (a.open + a.done)),
    categories,
  };
}

/** Remaining (not yet completed) top-level tasks of a list at the end of each of the last 14 days. */
export async function burndown(userId: string, listId: string, now = new Date()) {
  await assertCanAccess(userId, { listId });
  const tasks = await prisma.task.findMany({
    where: { listId, parentTaskId: null },
    select: { id: true, createdAt: true, updatedAt: true, status: { select: { name: true, type: true } } },
  });
  const times = await completionTimes(tasks.filter((t) => t.status.type === "done"));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const points = Array.from({ length: BURNDOWN_DAYS }, (_, i) => {
    const dayStart = today - (BURNDOWN_DAYS - 1 - i) * DAY_MS;
    const dayEnd = Math.min(dayStart + DAY_MS - 1, now.getTime());
    const remaining = tasks.filter((t) => {
      if (t.createdAt.getTime() > dayEnd) return false;
      const completed = times.get(t.id);
      return !completed || completed.getTime() > dayEnd;
    }).length;
    return { date: new Date(dayStart).toISOString().slice(0, 10), remaining };
  });
  return { points, total: tasks.length };
}
