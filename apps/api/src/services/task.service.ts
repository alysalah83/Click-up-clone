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
import {
  assertCanAccess,
  assertStatusInList,
  inMyWorkspaces,
} from "./access.service.js";
import { taskInclude, toTaskDto } from "./task.dto.js";
import {
  diffTaskActivity,
  logActivity,
  type ActivityRow,
} from "./activity.service.js";
import { runAutomations } from "./automation.service.js";
import { storedBlobUrls } from "./attachment.service.js";
import { deleteBlobsBestEffort } from "../lib/blobStorage.js";
import { syncCompletedAt } from "./completion.service.js";
import { spawnNextOccurrence } from "./recurrence.service.js";
import { notifyAssigned, notifyTaskChanges } from "./notification.service.js";

/** Top-level views (board, table, list, calendar, counts) never show subtasks. */
const topLevel = { parentTaskId: null };

const snapshotSelect = {
  id: true,
  name: true,
  priority: true,
  startDate: true,
  endDate: true,
  points: true,
  listId: true,
  status: { select: { id: true, name: true } },
} as const;

async function statusName(statusId: string | undefined) {
  if (!statusId) return undefined;
  const status = await prisma.status.findUnique({
    where: { id: statusId },
    select: { name: true },
  });
  return status?.name;
}

export async function createTask(userId: string, input: CreateTaskInput) {
  await assertCanAccess(userId, { listId: input.listId });
  await assertStatusInList(userId, input.statusId, input.listId);
  const task = await prisma.task.create({
    data: { ...input, userId },
    include: taskInclude,
  });
  await logActivity([{ taskId: task.id, actorId: userId, type: "created" }]);
  if (task.status.type === "done") await syncCompletedAt([task.id]);
  await runAutomations(userId, { type: "task_created", taskId: task.id });
  return toTaskDto(
    (await prisma.task.findUnique({ where: { id: task.id }, include: taskInclude })) ?? task,
  );
}

export function countTasks(userId: string, listId?: string) {
  return prisma.task.count({
    where: {
      ...inMyWorkspaces(userId),
      ...topLevel,
      ...(listId && { listId }),
    },
  });
}

export async function listTasks(userId: string, query: TasksQuery) {
  const orderBy: Prisma.TaskOrderByWithRelationInput[] = [];
  if (query.status) orderBy.push({ status: { order: query.status } });
  if (query.priority) orderBy.push({ priority: query.priority });
  if (query.createdAt) orderBy.push({ createdAt: query.createdAt });
  if (query.dueDate) orderBy.push({ startDate: query.dueDate });
  orderBy.push({ id: "asc" }); // tie-breaker so cursor pagination is stable

  const tasks = await prisma.task.findMany({
    where: {
      ...inMyWorkspaces(userId),
      ...topLevel,
      ...(query.listId && { listId: query.listId }),
    },
    include: taskInclude,
    orderBy,
    take: query.limit,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const nextCursor =
    tasks.length === query.limit ? tasks[tasks.length - 1]!.id : null;
  return { tasks: tasks.map(toTaskDto), nextCursor };
}

export async function priorityCounts(userId: string, listId?: string) {
  const groups = await prisma.task.groupBy({
    where: {
      ...inMyWorkspaces(userId),
      ...topLevel,
      ...(listId && { listId }),
    },
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
    prisma.task.count({
      where: { listId, ...topLevel, status: { type: "done" } },
    }),
    prisma.task.count({ where: { listId, ...topLevel } }),
  ]);
  return { totalTasksCount, completedTasksCount };
}

export async function updateTask(
  userId: string,
  id: string,
  data: UpdateTaskInput,
) {
  const task = await prisma.task.findFirst({
    where: { id, ...inMyWorkspaces(userId) },
    select: snapshotSelect,
  });
  if (!task) throw new NotFoundError("Task not found");
  if (data.statusId)
    await assertStatusInList(userId, data.statusId, task.listId);
  const updated = await prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });
  const rows = diffTaskActivity(userId, task, data, updated.status.name);
  await logActivity(rows);
  await notifyTaskChanges(userId, [{ id, name: updated.name }], rows);
  if (rows.some((r) => r.type === "status")) {
    await syncCompletedAt([id]);
    if (updated.status.type === "done") await spawnNextOccurrence(userId, id);
    await runAutomations(userId, { type: "status_changed", taskId: id, statusId: updated.statusId });
    return toTaskDto(
      (await prisma.task.findUnique({ where: { id }, include: taskInclude })) ?? updated,
    );
  }
  return toTaskDto(updated);
}

export async function updateTasks(
  userId: string,
  { tasksId, updatedFields }: BulkUpdateTasksInput,
) {
  const ids = [...new Set(tasksId)];
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids }, ...inMyWorkspaces(userId) },
    select: snapshotSelect,
  });
  if (tasks.length !== ids.length)
    throw new NotFoundError("One or more tasks not found");

  if (updatedFields.statusId)
    for (const listId of new Set(tasks.map((t) => t.listId)))
      await assertStatusInList(userId, updatedFields.statusId, listId);

  await prisma.task.updateMany({
    where: { id: { in: ids } },
    data: updatedFields,
  });
  const nextStatusName = await statusName(updatedFields.statusId);
  const rows = tasks.flatMap((task) =>
    diffTaskActivity(userId, task, updatedFields, nextStatusName),
  );
  await logActivity(rows);
  await notifyTaskChanges(userId, tasks, rows);
  if (updatedFields.statusId) await syncCompletedAt(ids);
  const movedToDone = updatedFields.statusId
    ? (
        await prisma.status.findUnique({
          where: { id: updatedFields.statusId },
          select: { type: true },
        })
      )?.type === "done"
    : false;
  for (const row of rows)
    if (row.type === "status" && updatedFields.statusId) {
      if (movedToDone) await spawnNextOccurrence(userId, row.taskId);
      await runAutomations(userId, {
        type: "status_changed",
        taskId: row.taskId,
        statusId: updatedFields.statusId,
      });
    }
}

export async function deleteTask(userId: string, id: string) {
  await assertCanAccess(userId, { taskId: id });
  const blobs = await storedBlobUrls({ OR: [{ taskId: id }, { task: { parentTaskId: id } }] });
  const deleted = await prisma.task.delete({ where: { id } });
  await deleteBlobsBestEffort(blobs);
  return deleted;
}

export async function deleteTasksInList(
  userId: string,
  listId: string,
  ids: string[],
) {
  const where = { ...inMyWorkspaces(userId), listId, id: { in: ids } };
  const blobs = await storedBlobUrls({ OR: [{ task: where }, { task: { parentTask: where } }] });
  const result = await prisma.task.deleteMany({ where });
  await deleteBlobsBestEffort(blobs);
  return result.count;
}

/** Replaces the task's assignees. Every user must be a member of the task's workspace. */
export async function setAssignees(
  userId: string,
  id: string,
  { userIds }: SetAssigneesInput,
) {
  const { workspaceId } = await assertCanAccess(userId, { taskId: id });
  const ids = [...new Set(userIds)];
  const members = await prisma.workspaceMember.count({
    where: { workspaceId, userId: { in: ids } },
  });
  if (members !== ids.length)
    throw new ValidationError("Assignees must be members of the workspace", {
      formErrors: [],
      fieldErrors: { userIds: ["Assignees must be members of the workspace"] },
    });

  const before = await prisma.taskAssignee.findMany({
    where: { taskId: id },
    select: { userId: true },
  });
  const beforeIds = new Set(before.map((a) => a.userId));
  const added = ids.filter((assigneeId) => !beforeIds.has(assigneeId));
  const removed = [...beforeIds].filter(
    (assigneeId) => !ids.includes(assigneeId),
  );

  const [, , task] = await prisma.$transaction([
    prisma.taskAssignee.deleteMany({
      where: { taskId: id, userId: { notIn: ids } },
    }),
    prisma.taskAssignee.createMany({
      data: ids.map((assigneeId) => ({ taskId: id, userId: assigneeId })),
      skipDuplicates: true,
    }),
    prisma.task.findUniqueOrThrow({ where: { id }, include: taskInclude }),
  ]);

  if (added.length + removed.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: [...added, ...removed] } },
      select: { id: true, name: true, email: true },
    });
    const nameOf = (uid: string) => {
      const user = users.find((u) => u.id === uid);
      return user?.name ?? user?.email ?? "someone";
    };
    const rows: ActivityRow[] = [
      ...added.map((uid) => ({
        taskId: id,
        actorId: userId,
        type: "assignee_added" as const,
        data: { userId: uid, name: nameOf(uid) },
      })),
      ...removed.map((uid) => ({
        taskId: id,
        actorId: userId,
        type: "assignee_removed" as const,
        data: { userId: uid, name: nameOf(uid) },
      })),
    ];
    await logActivity(rows);
    await notifyAssigned(userId, task, added);
  }
  return toTaskDto(task);
}
