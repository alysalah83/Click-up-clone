import type { NotificationType } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { assigneeUserSelect } from "./task.dto.js";
import type { ActivityRow } from "./activity.service.js";

type NotificationRow = {
  userId: string;
  actorId: string;
  type: NotificationType;
  taskId: string;
  commentId?: string;
  message: string;
};

/** Writes notifications; the actor is never notified about their own action. */
export async function createNotifications(rows: NotificationRow[]) {
  const data = rows.filter((row) => row.userId !== row.actorId);
  if (data.length > 0) await prisma.notification.createMany({ data });
}

export async function actorName(actorId: string) {
  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: { name: true, email: true },
  });
  return user?.name ?? user?.email ?? "Someone";
}

/** Everyone following a task: its assignees and anyone who commented on it. */
export async function taskFollowers(taskId: string): Promise<string[]> {
  const [assignees, commenters] = await Promise.all([
    prisma.taskAssignee.findMany({ where: { taskId }, select: { userId: true } }),
    prisma.comment.findMany({ where: { taskId }, select: { authorId: true }, distinct: ["authorId"] }),
  ]);
  return [...new Set([...assignees.map((a) => a.userId), ...commenters.map((c) => c.authorId)])];
}

export async function notifyAssigned(actorId: string, task: { id: string; name: string }, userIds: string[]) {
  if (userIds.length === 0) return;
  const actor = await actorName(actorId);
  await createNotifications(
    userIds.map((userId) => ({
      userId,
      actorId,
      type: "ASSIGNED" as const,
      taskId: task.id,
      message: `${actor} assigned you to "${task.name}"`,
    })),
  );
}

const CHANGE_LABELS: Partial<Record<ActivityRow["type"], string>> = {
  renamed: "the title",
  status: "the status",
  priority: "the priority",
  dates: "the dates",
};

/** TASK_UPDATED for followers when title, status, priority or dates changed (`rows` = the activity diff). */
export async function notifyTaskChanges(actorId: string, tasks: { id: string; name: string }[], rows: ActivityRow[]) {
  const changed = tasks.filter((t) => rows.some((r) => r.taskId === t.id && CHANGE_LABELS[r.type]));
  if (changed.length === 0) return;
  const actor = await actorName(actorId);
  const notifications: NotificationRow[] = [];
  for (const task of changed) {
    const labels = [
      ...new Set(rows.filter((r) => r.taskId === task.id).map((r) => CHANGE_LABELS[r.type]).filter(Boolean)),
    ];
    const followers = await taskFollowers(task.id);
    for (const userId of followers)
      notifications.push({
        userId,
        actorId,
        type: "TASK_UPDATED",
        taskId: task.id,
        message: `${actor} changed ${labels.join(", ")} of "${task.name}"`,
      });
  }
  await createNotifications(notifications);
}

const notificationSelect = {
  id: true,
  type: true,
  message: true,
  taskId: true,
  commentId: true,
  readAt: true,
  createdAt: true,
  actor: { select: assigneeUserSelect },
  task: { select: { id: true, name: true, listId: true } },
} as const;

export function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    select: notificationSelect,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function unreadCount(userId: string) {
  return { count: await prisma.notification.count({ where: { userId, readAt: null } }) };
}

export async function markRead(userId: string, id: string) {
  const result = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (result.count === 0) {
    const exists = await prisma.notification.count({ where: { id, userId } });
    if (!exists) throw new NotFoundError("Notification not found");
  }
  return prisma.notification.findUniqueOrThrow({ where: { id }, select: notificationSelect });
}

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}
