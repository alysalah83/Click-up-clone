import type {
  BulkUpdateTasksInput,
  CreateTaskInput,
  SetAssigneesInput,
  TasksQuery,
  UpdateTaskInput,
} from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, assertStatusInList, inMyWorkspaces } from "./access.service.js";
import { taskInclude, toTaskDto } from "./task.dto.js";

export async function createTask(userId: string, input: CreateTaskInput) {
  await assertCanAccess(userId, { listId: input.listId });
  await assertStatusInList(userId, input.statusId, input.listId);
  return toTaskDto(await prisma.task.create({ data: { ...input, userId }, include: taskInclude }));
}

export function countTasks(userId: string, listId?: string) {
  return prisma.task.count({ where: { ...inMyWorkspaces(userId), ...(listId && { listId }) } });
}

export async function listTasks(userId: string, query: TasksQuery) {
  const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];
  if (query.status) orderBy.push({ status: { order: query.status } });
  if (query.priority) orderBy.push({ priority: query.priority });
  if (query.createdAt) orderBy.push({ createdAt: query.createdAt });
  if (query.dueDate) orderBy.push({ startDate: query.dueDate });
  orderBy.push({ id: "asc" }); // tie-breaker so cursor pagination is stable

  const tasks = await prisma.task.findMany({
    where: { ...inMyWorkspaces(userId), ...(query.listId && { listId: query.listId }) },
    include: taskInclude,
    orderBy,
    take: query.limit,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const nextCursor = tasks.length === query.limit ? tasks[tasks.length - 1]!.id : null;
  return { tasks: tasks.map(toTaskDto), nextCursor };
}

export async function priorityCounts(userId: string, listId?: string) {
  const groups = await prisma.task.groupBy({
    where: { ...inMyWorkspaces(userId), ...(listId && { listId }) },
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
  const task = await prisma.task.findFirst({
    where: { id, ...inMyWorkspaces(userId) },
    select: { listId: true },
  });
  if (!task) throw new NotFoundError("Task not found");
  if (data.statusId) await assertStatusInList(userId, data.statusId, task.listId);
  return toTaskDto(await prisma.task.update({ where: { id }, data, include: taskInclude }));
}

export async function updateTasks(userId: string, { tasksId, updatedFields }: BulkUpdateTasksInput) {
  const ids = [...new Set(tasksId)];
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids }, ...inMyWorkspaces(userId) },
    select: { listId: true },
  });
  if (tasks.length !== ids.length) throw new NotFoundError("One or more tasks not found");

  if (updatedFields.statusId)
    for (const listId of new Set(tasks.map((t) => t.listId)))
      await assertStatusInList(userId, updatedFields.statusId, listId);

  await prisma.task.updateMany({ where: { id: { in: ids } }, data: updatedFields });
}

export async function deleteTask(userId: string, id: string) {
  await assertCanAccess(userId, { taskId: id });
  return prisma.task.delete({ where: { id } });
}

export async function deleteTasksInList(userId: string, listId: string, ids: string[]) {
  const result = await prisma.task.deleteMany({
    where: { ...inMyWorkspaces(userId), listId, id: { in: ids } },
  });
  return result.count;
}

/** Replaces the task's assignees. Every user must be a member of the task's workspace. */
export async function setAssignees(userId: string, id: string, { userIds }: SetAssigneesInput) {
  const { workspaceId } = await assertCanAccess(userId, { taskId: id });
  const ids = [...new Set(userIds)];
  const members = await prisma.workspaceMember.count({ where: { workspaceId, userId: { in: ids } } });
  if (members !== ids.length)
    throw new ValidationError("Assignees must be members of the workspace", {
      formErrors: [],
      fieldErrors: { userIds: ["Assignees must be members of the workspace"] },
    });

  const [, , task] = await prisma.$transaction([
    prisma.taskAssignee.deleteMany({ where: { taskId: id, userId: { notIn: ids } } }),
    prisma.taskAssignee.createMany({
      data: ids.map((assigneeId) => ({ taskId: id, userId: assigneeId })),
      skipDuplicates: true,
    }),
    prisma.task.findUniqueOrThrow({ where: { id }, include: taskInclude }),
  ]);
  return toTaskDto(task);
}
