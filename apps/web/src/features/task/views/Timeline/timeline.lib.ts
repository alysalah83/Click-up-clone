import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

export const DAY_W = 40;
export const ROW_H = 40;
export const HEADER_H = 52;
export const LABEL_W = 224;

export type Span = { start: Date; end: Date; scheduled: boolean };

/**
 * A task's bar: start/due dates as calendar days (inclusive). A task with one date gets a
 * one-day bar; an undated task gets a one-day, unscheduled bar on `today`.
 */
export function taskSpan(
  task: { startDate: Date | string | null; endDate: Date | string | null },
  today: Date,
): Span {
  const s = task.startDate ? startOfDay(new Date(task.startDate)) : null;
  const e = task.endDate ? startOfDay(new Date(task.endDate)) : null;
  if (!s && !e) return { start: today, end: today, scheduled: false };
  const start = s ?? e!;
  const end = e ?? s!;
  return end < start
    ? { start: end, end: start, scheduled: true }
    : { start, end, scheduled: true };
}

export type DragMode = "move" | "start" | "end";

/** Applies a drag of `delta` days to a span; a bar always keeps at least one day. */
export function applyDrag(span: Span, mode: DragMode, delta: number): Span {
  if (mode === "move")
    return { ...span, start: addDays(span.start, delta), end: addDays(span.end, delta) };
  if (mode === "start") {
    const start = addDays(span.start, delta);
    return { ...span, start: start > span.end ? span.end : start };
  }
  const end = addDays(span.end, delta);
  return { ...span, end: end < span.start ? span.start : end };
}

/** Day column index of `date` relative to the axis origin. */
export const dayIndex = (date: Date, origin: Date) => differenceInCalendarDays(date, origin);

/** Bar rectangle in axis pixels (the end day is inclusive). */
export function barRect(span: Span, origin: Date) {
  const x = dayIndex(span.start, origin) * DAY_W;
  const width = (differenceInCalendarDays(span.end, span.start) + 1) * DAY_W;
  return { x, width };
}

/**
 * Elbow path for a "blocked by" arrow: from the right edge of the blocker's bar to the left
 * edge of the blocked task's bar.
 */
export function arrowPath(x1: number, y1: number, x2: number, y2: number) {
  const gap = 10;
  if (x2 >= x1 + gap * 2) {
    const xm = x1 + gap;
    return `M${x1},${y1} H${xm} V${y2} H${x2}`;
  }
  // Blocked bar starts before the blocker ends: loop around through the gap between rows.
  const ym = y2 > y1 ? y1 + ROW_H / 2 : y1 - ROW_H / 2;
  return `M${x1},${y1} H${x1 + gap} V${ym} H${x2 - gap} V${y2} H${x2}`;
}
