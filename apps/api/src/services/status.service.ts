import type { CreateStatusInput, UpdateStatusInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors/appError.js";
import { ForbiddenError, NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess } from "./access.service.js";

export async function listStatuses(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  return prisma.status.findMany({ where: { listId }, orderBy: { order: "asc" } });
}

export async function createStatus(userId: string, { listId, ...fields }: CreateStatusInput) {
  await assertCanAccess(userId, { listId });
  const last = await prisma.status.findFirst({
    where: { listId, type: { not: "done" } },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return prisma.status.create({
    data: { ...fields, listId, userId, type: "active", order: (last?.order ?? 100) + 100 },
  });
}

export async function updateStatus(userId: string, id: string, data: UpdateStatusInput) {
  await assertCanAccess(userId, { statusId: id });
  return prisma.status.update({ where: { id }, data });
}

export async function deleteStatus(userId: string, id: string) {
  const status = await prisma.status.findFirst({ where: { id, userId } });
  if (!status) throw new NotFoundError("Status not found");
  if (status.isDefault) throw new ForbiddenError("Default statuses cannot be deleted");

  return prisma.$transaction(async (tx) => {
    const fallback = await tx.status.findFirst({
      where: { listId: status.listId, type: "open" },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    if (!fallback) throw new AppError("List has no open status to move tasks into", 500);

    const moved = await tx.task.updateMany({ where: { statusId: id }, data: { statusId: fallback.id } });
    const deleted = await tx.status.delete({ where: { id } });
    return { ...deleted, movedTasksCount: moved.count };
  });
}

/**
 * Shape kept for the dashboard: `{ totalCount, "<status name>Count": n }`, plus an
 * additive `colors` map of status name -> bgColor (the first status found with that name).
 */
export async function taskCountsByStatusName(userId: string) {
  const statuses = await prisma.status.findMany({
    where: { userId },
    select: { name: true, bgColor: true, _count: { select: { tasks: true } } },
  });

  const counts: Record<string, number> = {};
  const colors: Record<string, string> = {};
  let totalCount = 0;
  for (const status of statuses) {
    const key = `${status.name}Count`;
    counts[key] = (counts[key] ?? 0) + status._count.tasks;
    totalCount += status._count.tasks;
    if (!(status.name in colors)) colors[status.name] = status.bgColor;
  }
  return { totalCount, ...counts, colors };
}
