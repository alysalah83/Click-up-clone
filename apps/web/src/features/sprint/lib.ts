import { format } from "date-fns";
import type { List } from "@/features/list/types";

/** The points picker values, like ClickUp's sprint points. */
export const POINT_OPTIONS = [1, 2, 3, 5, 8, 13] as const;

export type SprintList = List & {
  sprintNumber: number;
  sprintStart: string | Date;
  sprintEnd: string | Date;
};

export const isSprintList = (list: List | undefined | null): list is SprintList =>
  list?.sprintNumber != null && !!list.sprintStart && !!list.sprintEnd;

/** "Oct 1 – Oct 14" (sprint dates sit at 12:00 UTC, the same calendar day almost everywhere). */
export function sprintRange(start: string | Date, end: string | Date) {
  return `${format(new Date(start), "MMM d")} – ${format(new Date(end), "MMM d")}`;
}

/** Sprint lists by number, and the rest in their original order. */
export function splitSprintLists(lists: List[]) {
  const sprints = lists.filter(isSprintList).sort((a, b) => a.sprintNumber - b.sprintNumber);
  return { sprints, others: lists.filter((l) => !isSprintList(l)) };
}

/** Whole days from today to the sprint's last day (0 on the last day, negative once over). */
export function daysLeft(end: string | Date, now = new Date()) {
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const endDate = new Date(end);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((day(endDate) - today) / 86_400_000);
}

export const sumPoints = (tasks: { points?: number | null }[]) =>
  tasks.reduce((sum, t) => sum + (t.points ?? 0), 0);
