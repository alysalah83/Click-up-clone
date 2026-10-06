import type { RecurrenceType } from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { logActivity } from "./activity.service.js";
import { runAutomations } from "./automation.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function addMonthClamped(date: Date, months: number): Date {
  const target = new Date(date.getTime());
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

/**
 * The date of the next occurrence: daily = +1 day, weekly = +7 days, monthly = +1 month
 * (clamped to the month's last day: Jan 31 -> Feb 28), custom = +`interval` days.
 * Returns the date unchanged for "none".
 */
export function nextOccurrenceDate(date: Date, type: RecurrenceType, interval = 1): Date {
  switch (type) {
    case "daily":
      return new Date(date.getTime() + DAY_MS);
    case "weekly":
      return new Date(date.getTime() + 7 * DAY_MS);
    case "monthly":
      return addMonthClamped(date, 1);
    case "custom":
      return new Date(date.getTime() + Math.max(1, interval) * DAY_MS);
    default:
      return date;
  }
}

/** Shifts the start and due dates of a completed task to the next occurrence; missing dates stay missing. */
export function nextOccurrenceDates(
  dates: { startDate: Date | null; endDate: Date | null },
  type: RecurrenceType,
  interval = 1,
) {
  return {
    startDate: dates.startDate ? nextOccurrenceDate(dates.startDate, type, interval) : null,
    endDate: dates.endDate ? nextOccurrenceDate(dates.endDate, type, interval) : null,
  };
}

const shiftBy = (date: Date | null, ms: number) => (date ? new Date(date.getTime() + ms) : null);

/**
 * Called after a task moved into a done-type status. If the task repeats, creates the next
 * occurrence (name, description, priority, assignees, tags; dates shifted; first open status of the
 * list) and clears the recurrence on the completed task. Checklists are copied with every item
 * unchecked, and direct subtasks are copied in the open status with their dates moved by the same
 * offset as the parent's. The rule is claimed with a conditional update, so two concurrent
 * completions create only one copy. Returns the new task id, or null.
 * Failures never fail the status change that triggered it.
 */
export async function spawnNextOccurrence(actorId: string, taskId: string): Promise<string | null> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: { select: { userId: true } },
        tags: { select: { tagId: true } },
        checklists: {
          orderBy: { order: "asc" },
          include: { items: { orderBy: { order: "asc" } } },
        },
        subtasks: {
          orderBy: { createdAt: "asc" },
          include: {
            assignees: { select: { userId: true } },
            tags: { select: { tagId: true } },
          },
        },
      },
    });
    if (!task || task.recurrenceType === "none") return null;

    const claimed = await prisma.task.updateMany({
      where: { id: taskId, recurrenceType: { not: "none" } },
      data: { recurrenceType: "none", recurrenceInterval: 1 },
    });
    if (claimed.count === 0) return null;

    const statuses = await prisma.status.findMany({
      where: { listId: task.listId },
      orderBy: { order: "asc" },
      select: { id: true, type: true },
    });
    const openStatus = statuses.find((s) => s.type === "open") ?? statuses[0];
    if (!openStatus) return null;

    const dates = nextOccurrenceDates(task, task.recurrenceType, task.recurrenceInterval);
    // Subtasks move by the parent's own shift; when the parent has no dates, by the rule itself.
    const anchor = task.endDate ?? task.startDate;
    const nextAnchor = dates.endDate ?? dates.startDate;
    const subtaskDates = (sub: { startDate: Date | null; endDate: Date | null }) =>
      anchor && nextAnchor
        ? {
            startDate: shiftBy(sub.startDate, nextAnchor.getTime() - anchor.getTime()),
            endDate: shiftBy(sub.endDate, nextAnchor.getTime() - anchor.getTime()),
          }
        : nextOccurrenceDates(sub, task.recurrenceType, task.recurrenceInterval);

    const next = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          name: task.name,
          userId: task.userId,
          listId: task.listId,
          statusId: openStatus.id,
          priority: task.priority,
          points: task.points,
          parentTaskId: task.parentTaskId,
          ...(task.description !== null && { description: task.description as Prisma.InputJsonValue }),
          ...dates,
          recurrenceType: task.recurrenceType,
          recurrenceInterval: task.recurrenceInterval,
          assignees: { createMany: { data: task.assignees.map(({ userId }) => ({ userId })) } },
          tags: { createMany: { data: task.tags.map(({ tagId }) => ({ tagId })) } },
        },
        select: { id: true },
      });

      for (const checklist of task.checklists) {
        await tx.checklist.create({
          data: {
            taskId: created.id,
            name: checklist.name,
            order: checklist.order,
            items: {
              createMany: {
                data: checklist.items.map(({ text, order, assigneeId }) => ({
                  text,
                  order,
                  assigneeId,
                  done: false,
                })),
              },
            },
          },
        });
      }

      for (const sub of task.subtasks) {
        await tx.task.create({
          data: {
            name: sub.name,
            userId: sub.userId,
            listId: sub.listId,
            statusId: openStatus.id,
            priority: sub.priority,
            parentTaskId: created.id,
            ...(sub.description !== null && { description: sub.description as Prisma.InputJsonValue }),
            ...subtaskDates(sub),
            assignees: { createMany: { data: sub.assignees.map(({ userId }) => ({ userId })) } },
            tags: { createMany: { data: sub.tags.map(({ tagId }) => ({ tagId })) } },
          },
        });
      }
      return created;
    });
    await logActivity([
      {
        taskId,
        actorId,
        type: "recurred",
        data: { nextTaskId: next.id, dueDate: dates.endDate?.toISOString() ?? null },
      },
      { taskId: next.id, actorId, type: "created" },
    ]);
    await runAutomations(actorId, { type: "task_created", taskId: next.id });
    return next.id;
  } catch (error) {
    console.error("Recurring task failed", error);
    return null;
  }
}
