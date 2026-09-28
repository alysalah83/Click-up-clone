import type {
  BulkUpdateTasksInput,
  CreateTaskInput,
  TasksQuery,
  UpdateTaskInput,
} from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess, assertStatusInList } from "./access.service.js";

const withStatus = { status: true } as const;

export async function createTask(userId: string, input: CreateTaskInput) {
  await assertCanAccess(userId, { listId: input.listId });
  await assertStatusInList(userId, input.statusId, input.listId);
  return prisma.task.create({ data: { ...input, userId }, include: withStatus });
}

export function countTasks(userId: string, listId?: string) {
  return prisma.task.count({ where: { userId, ...(listId && { listId }) } });
}

export async function listTasks(userId: string, query: TasksQuery) {
  const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];
  if (query.status) orderBy.push({ status: { order: query.status } });
  if (query.priority) orderBy.push({ priority: query.priority });
  if (query.createdAt) orderBy.push({ createdAt: query.createdAt });
  if (query.dueDate) orderBy.push({ startDate: query.dueDate });
  orderBy.push({ id: "asc" }); // tie-breaker so cursor pagination is stable

  const tasks = await prisma.task.findMany({
    where: { userId, ...(query.listId && { listId: query.listId }) },
    include: withStatus,
    orderBy,
    take: query.limit,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const nextCursor = tasks.length === query.limit ? tasks[tasks.length - 1]!.id : null;
  return { tasks, nextCursor };
}

export async function priorityCounts(userId: string, listId?: string) {
  const groups = await prisma.task.groupBy({
    where: { userId, ...(listId && { listId }) },
    by: "priority",
    _count: { priority: true },
  });
  const counts: Record<string, number> = {};
  for (const group of groups) counts[group.priority] = group._count.priority;
  return counts;
}

export async function completeAndTotalCounts(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  const [completedTasksCount, totalTasksCount] = await Promise.all([
    prisma.task.count({ where: { listId, status: { type: "done" } } }),
    prisma.task.count({ where: { listId } }),
  ]);
  return { totalTasksCount, completedTasksCount };
}

export async function updateTask(userId: string, id: string, data: UpdateTaskInput) {
  const task = await prisma.task.findFirst({ where: { id, userId }, select: { listId: true } });
  if (!task) throw new NotFoundError("Task not found");
  if (data.statusId) await assertStatusInList(userId, data.statusId, task.listId);
  return prisma.task.update({ where: { id }, data, include: withStatus });
}

export async function updateTasks(userId: string, { tasksId, updatedFields }: BulkUpdateTasksInput) {
  const ids = [...new Set(tasksId)];
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids }, userId },
    select: { listId: true },
  });
  if (tasks.length !== ids.length) throw new NotFoundError("One or more tasks not found");

  if (updatedFields.statusId)
    for (const listId of new Set(tasks.map((t) => t.listId)))
      await assertStatusInList(userId, updatedFields.statusId, listId);

  await prisma.task.updateMany({ where: { id: { in: ids }, userId }, data: updatedFields });
}

export async function deleteTask(userId: string, id: string) {
  await assertCanAccess(userId, { taskId: id });
  return prisma.task.delete({ where: { id } });
}

export async function deleteTasksInList(userId: string, listId: string, ids: string[]) {
  const result = await prisma.task.deleteMany({ where: { userId, listId, id: { in: ids } } });
  return result.count;
}
