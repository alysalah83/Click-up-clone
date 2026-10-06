import type { ActivityType } from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export type ActivityRow = {
  taskId: string;
  actorId: string;
  type: ActivityType;
  data?: Prisma.InputJsonObject;
};

/** Description saves are debounced autosaves: one "edited the description" per actor per 5 minutes. */
export const DESCRIPTION_COALESCE_MS = 5 * 60 * 1000;

export function activityData(
  rows: ActivityRow[],
): Prisma.ActivityCreateManyInput[] {
  return rows.map(({ data, ...row }) => ({ ...row, data: data ?? {} }));
}

export async function logActivity(rows: ActivityRow[]) {
  if (rows.length > 0)
    await prisma.activity.createMany({ data: activityData(rows) });
}

export async function logDescriptionEdit(
  taskId: string,
  actorId: string,
  now = new Date(),
) {
  const recent = await prisma.activity.count({
    where: {
      taskId,
      actorId,
      type: "description",
      createdAt: { gte: new Date(now.getTime() - DESCRIPTION_COALESCE_MS) },
    },
  });
  if (recent === 0)
    await logActivity([{ taskId, actorId, type: "description" }]);
}

const day = (date: Date | null | undefined) =>
  date ? date.toISOString() : null;

type TaskSnapshot = {
  id: string;
  name: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  points?: number | null;
  status: { id: string; name: string };
};

/**
 * Activity rows for a task update: rename, status, priority and dates changes.
 * `nextStatusName` is the new status's name when the status changed.
 */
export function diffTaskActivity(
  actorId: string,
  before: TaskSnapshot,
  changes: {
    name?: string;
    statusId?: string;
    priority?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    points?: number | null;
  },
  nextStatusName?: string,
): ActivityRow[] {
  const rows: ActivityRow[] = [];
  const base = { taskId: before.id, actorId };
  if (changes.name !== undefined && changes.name !== before.name)
    rows.push({
      ...base,
      type: "renamed",
      data: { from: before.name, to: changes.name },
    });
  if (changes.statusId && changes.statusId !== before.status.id)
    rows.push({
      ...base,
      type: "status",
      data: { from: before.status.name, to: nextStatusName ?? "" },
    });
  if (changes.priority !== undefined && changes.priority !== before.priority)
    rows.push({
      ...base,
      type: "priority",
      data: { from: before.priority, to: changes.priority },
    });
  if (changes.points !== undefined && changes.points !== (before.points ?? null))
    rows.push({
      ...base,
      type: "points",
      data: {
        from: before.points == null ? null : String(before.points),
        to: changes.points === null ? null : String(changes.points),
      },
    });

  const startChanged =
    changes.startDate !== undefined &&
    day(changes.startDate) !== day(before.startDate);
  const endChanged =
    changes.endDate !== undefined &&
    day(changes.endDate) !== day(before.endDate);
  if (startChanged || endChanged)
    rows.push({
      ...base,
      type: "dates",
      data: {
        startDate: day(
          changes.startDate === undefined
            ? before.startDate
            : changes.startDate,
        ),
        endDate: day(
          changes.endDate === undefined ? before.endDate : changes.endDate,
        ),
      },
    });
  return rows;
}
