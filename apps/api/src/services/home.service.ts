import type { MyWorkBucket } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { inMyWorkspaces, listInMyWorkspaces, memberOf } from "./access.service.js";
import { assigneeUserSelect } from "./task.dto.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Buckets a due date by the client's calendar day (`tzOffsetMinutes` = UTC offset, east positive). */
export function bucketFor(due: Date | null, now: Date, tzOffsetMinutes = 0): MyWorkBucket {
  if (!due) return "nodate";
  const day = (d: Date) => Math.floor((d.getTime() + tzOffsetMinutes * 60_000) / DAY_MS);
  const diff = day(due) - day(now);
  return diff < 0 ? "overdue" : diff === 0 ? "today" : "upcoming";
}

/** Tasks assigned to me across all my workspaces, by due date (undated last). */
export async function myWork(userId: string, tz = 0, now = new Date()) {
  const tasks = await prisma.task.findMany({
    where: { ...inMyWorkspaces(userId), assignees: { some: { userId } } },
    select: {
      id: true,
      name: true,
      priority: true,
      startDate: true,
      endDate: true,
      status: { select: { id: true, name: true, type: true, icon: true, iconColor: true, bgColor: true } },
      list: { select: { id: true, name: true, workspaceId: true, workspace: { select: { name: true } } } },
    },
    orderBy: [{ endDate: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    take: 300,
  });
  return tasks.map(({ endDate, list, ...task }) => ({
    ...task,
    dueDate: endDate,
    bucket: bucketFor(endDate, now, tz),
    list: { id: list.id, name: list.name, workspaceId: list.workspaceId, workspaceName: list.workspace.name },
  }));
}

const LIMIT = 8;

/** Case-insensitive search over tasks, lists and teammates in my workspaces. */
export async function search(userId: string, q: string) {
  const contains = { contains: q, mode: "insensitive" as const };
  const [tasks, lists, members] = await Promise.all([
    prisma.task.findMany({
      where: { ...inMyWorkspaces(userId), name: contains },
      select: { id: true, name: true, listId: true, status: { select: { id: true, name: true, type: true } } },
      orderBy: { updatedAt: "desc" },
      take: LIMIT,
    }),
    prisma.list.findMany({
      where: { ...listInMyWorkspaces(userId), name: contains },
      select: { id: true, name: true, workspaceId: true },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
    prisma.user.findMany({
      where: {
        memberships: { some: { workspace: memberOf(userId) } },
        OR: [{ name: contains }, { email: contains }],
      },
      select: assigneeUserSelect,
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
  ]);
  return { tasks, lists, members };
}
