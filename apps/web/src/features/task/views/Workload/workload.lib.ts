import { addDays, addWeeks, differenceInCalendarDays, startOfDay, startOfWeek } from "date-fns";
import type { Task } from "@/features/task/types";
import { UNASSIGNED } from "@/features/viewConfig/lib/applyViewConfig";

export type WorkloadMode = "day" | "week";
export type WorkloadMeasure = "tasks" | "points";

/** Default capacity per person per day; a week is 5 working days. */
export const DEFAULT_CAPACITY: Record<WorkloadMeasure, number> = { tasks: 3, points: 8 };
export const WEEK_DAYS = 5;
/** Columns shown: one week of days, or six weeks. */
export const PERIOD_COUNT: Record<WorkloadMode, number> = { day: 7, week: 6 };

export interface Period {
  /** First day of the period (local midnight). */
  start: Date;
  /** Day after the last day (exclusive). */
  end: Date;
}

/** Visible columns: the Monday-to-Sunday week of `anchor` (day mode) or six weeks from it. */
export function buildPeriods(anchor: Date, mode: WorkloadMode): Period[] {
  const monday = startOfWeek(startOfDay(anchor), { weekStartsOn: 1 });
  return Array.from({ length: PERIOD_COUNT[mode] }, (_, i) => {
    const start = mode === "day" ? addDays(monday, i) : addWeeks(monday, i);
    return { start, end: mode === "day" ? addDays(start, 1) : addWeeks(start, 1) };
  });
}

/** How far the prev/next buttons move the anchor. */
export const stepAnchor = (anchor: Date, mode: WorkloadMode, dir: -1 | 1) =>
  mode === "day" ? addWeeks(anchor, dir) : addWeeks(anchor, dir * PERIOD_COUNT.week);

/** Column of a date, or -1 outside the visible range. */
export function periodIndex(date: Date, periods: Period[]) {
  const day = startOfDay(date);
  return periods.findIndex((p) => day >= p.start && day < p.end);
}

/** Capacity of one cell from a per-day capacity. */
export const cellCapacity = (perDay: number, mode: WorkloadMode) =>
  mode === "week" ? perDay * WEEK_DAYS : perDay;

export type LoadLevel = "empty" | "under" | "near" | "over";

/** Red over capacity, amber from 80% up to it, green below. */
export function loadLevel(load: number, capacity: number): LoadLevel {
  if (load <= 0) return "empty";
  if (load > capacity) return "over";
  return load >= capacity * 0.8 ? "near" : "under";
}

/** Row keys a task belongs to: each assignee, or "Unassigned". */
export const rowKeysOf = (task: Pick<Task, "assignees">) =>
  task.assignees?.length ? task.assignees.map((a) => a.id) : [UNASSIGNED];

/** A task's weight in a measure. Done tasks are shown but do not count. */
export function taskLoad(task: Pick<Task, "points" | "status">, measure: WorkloadMeasure) {
  if (task.status?.type === "done") return 0;
  return measure === "tasks" ? 1 : (task.points ?? 0);
}

export interface WorkloadCell {
  tasks: Task[];
  load: number;
}

export interface WorkloadRow {
  key: string;
  cells: WorkloadCell[];
  /** Load over the visible range. */
  total: number;
}

/**
 * Buckets tasks into rows x columns. A task counts once, on its due date, for each of its
 * assignees (or in "Unassigned"); tasks without a due date or outside the range are left out.
 * Every key in `rowKeys` gets a row (in that order); assignees not in it are skipped.
 */
export function buildWorkload(
  tasks: Task[],
  rowKeys: string[],
  periods: Period[],
  measure: WorkloadMeasure,
): Map<string, WorkloadRow> {
  const rows = new Map<string, WorkloadRow>(
    rowKeys.map((key) => [key, { key, cells: periods.map(() => ({ tasks: [], load: 0 })), total: 0 }]),
  );
  for (const task of tasks) {
    if (!task.endDate) continue;
    const i = periodIndex(new Date(task.endDate), periods);
    if (i < 0) continue;
    const load = taskLoad(task, measure);
    for (const key of rowKeysOf(task)) {
      const row = rows.get(key);
      if (!row) continue;
      row.cells[i]!.tasks.push(task);
      row.cells[i]!.load += load;
      row.total += load;
    }
  }
  return rows;
}

/** Where a chip was dragged from / dropped on. */
export interface WorkloadPoint {
  rowKey: string;
  periodIndex: number;
}

export interface WorkloadMove {
  /** Set when the chip changed rows. */
  reassign?: { from: string; to: string };
  /** Days to shift the task's dates by (0 when the column did not change). */
  dayDelta: number;
}

/** What a drop changes; null when dropped on nothing or back on its own cell. */
export function resolveWorkloadDrop(
  from: WorkloadPoint,
  to: WorkloadPoint | null | undefined,
  periods: Period[],
): WorkloadMove | null {
  if (!to) return null;
  const a = periods[from.periodIndex];
  const b = periods[to.periodIndex];
  const dayDelta = a && b ? differenceInCalendarDays(b.start, a.start) : 0;
  const move: WorkloadMove = { dayDelta };
  if (to.rowKey !== from.rowKey) move.reassign = { from: from.rowKey, to: to.rowKey };
  return move.reassign || dayDelta ? move : null;
}

/** The task's dates moved by `days`, keeping its duration (a missing start stays missing). */
export function shiftTaskDates(task: Pick<Task, "startDate" | "endDate">, days: number) {
  const shift = (d: Date | string | null) => (d ? addDays(new Date(d), days) : null);
  return { startDate: shift(task.startDate), endDate: shift(task.endDate) };
}
