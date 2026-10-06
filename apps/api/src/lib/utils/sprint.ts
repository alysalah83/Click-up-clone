import { SPRINT_LENGTH_DAYS } from "@clickup/shared";

/** Pure sprint math: sprint windows, status mapping for carry-over and the burndown series. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** 12:00 UTC of `date`'s UTC day plus `offset` days: the same calendar day in almost every timezone. */
export const noonUtc = (date: Date, offset = 0) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + offset, 12));

const utcDayStart = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/** The next two-week window: the day after the previous sprint ends, or today for a first sprint. */
export function nextSprintWindow(previousEnd: Date | null | undefined, today: Date) {
  const start = previousEnd ? noonUtc(previousEnd, 1) : noonUtc(today);
  return { start, end: noonUtc(start, SPRINT_LENGTH_DAYS - 1) };
}

type StatusLike = { id: string; name: string; type: "open" | "active" | "done"; order: number; isDefault?: boolean };

/**
 * Where a carried task lands in the next sprint: the status with the same name (case-insensitive),
 * else the first status of the same type (defaults first), else the first open status.
 */
export function mapStatus(from: Pick<StatusLike, "name" | "type">, targets: StatusLike[]): string | undefined {
  const sorted = [...targets].sort((a, b) => Number(b.isDefault ?? false) - Number(a.isDefault ?? false) || a.order - b.order);
  const byName = targets.find((s) => s.name.trim().toLowerCase() === from.name.trim().toLowerCase());
  const byType = sorted.find((s) => s.type === from.type);
  const open = sorted.find((s) => s.type === "open") ?? [...targets].sort((a, b) => a.order - b.order)[0];
  return (byName ?? byType ?? open)?.id;
}

export interface BurndownTask {
  points: number | null;
  /** When the task was completed (null while unfinished). */
  completedAt: Date | null;
}

export interface BurndownPoint {
  date: string;
  /** The straight line from the committed total on day one to zero on the last day. */
  ideal: number;
  /** Still open at the end of that day; null for days that have not happened yet. */
  remaining: number | null;
}

/**
 * Remaining work per day of the sprint. Measured in points; when no task has points it falls
 * back to counting tasks, so a fresh sprint still gets a chart.
 */
export function buildBurndown({
  start,
  end,
  now,
  tasks,
}: {
  start: Date;
  end: Date;
  now: Date;
  tasks: BurndownTask[];
}): { unit: "points" | "tasks"; total: number; points: BurndownPoint[] } {
  const usePoints = tasks.some((t) => (t.points ?? 0) > 0);
  const weight = (t: BurndownTask) => (usePoints ? (t.points ?? 0) : 1);
  const total = tasks.reduce((sum, t) => sum + weight(t), 0);

  const first = utcDayStart(start);
  const days = Math.max(1, Math.round((utcDayStart(end) - first) / DAY_MS) + 1);
  const points = Array.from({ length: days }, (_, i) => {
    const dayStart = first + i * DAY_MS;
    const dayEnd = Math.min(dayStart + DAY_MS - 1, now.getTime());
    const ideal = days === 1 ? 0 : Math.round(total * (1 - i / (days - 1)) * 10) / 10;
    const remaining =
      dayStart > now.getTime()
        ? null
        : tasks.reduce(
            (sum, t) => sum + (t.completedAt && t.completedAt.getTime() <= dayEnd ? 0 : weight(t)),
            0,
          );
    return { date: new Date(dayStart).toISOString().slice(0, 10), ideal, remaining };
  });
  return { unit: usePoints ? "points" : "tasks", total, points };
}

/** Sum of points of tasks (missing points count as 0). */
export const sumPoints = (tasks: { points: number | null }[]) => tasks.reduce((sum, t) => sum + (t.points ?? 0), 0);
