import type { Task } from "@/features/task/types";
import type { DueFilter, GroupBy, ViewConfig, ViewFilters } from "../types";

export const EMPTY_FILTERS: ViewFilters = {
  assignees: [],
  statuses: [],
  priorities: [],
  tags: [],
  due: null,
};

export const DEFAULT_CONFIG: ViewConfig = { filters: EMPTY_FILTERS, groupBy: "status" };

export const UNASSIGNED = "__unassigned__";
export const NO_TAG = "__no_tag__";

export function countActiveFilters(f: ViewFilters) {
  return (
    (f.assignees.length ? 1 : 0) +
    (f.statuses.length ? 1 : 0) +
    (f.priorities.length ? 1 : 0) +
    (f.tags.length ? 1 : 0) +
    (f.due ? 1 : 0)
  );
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Parses `YYYY-MM-DD` as a local date. */
function parseLocalDate(iso: string | undefined) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

/** Due date = the task's end date. Weeks run Monday to Sunday. */
export function matchesDue(task: Task, due: DueFilter | null, now = new Date()) {
  if (!due) return true;
  if (due.kind === "none") return !task.endDate;
  if (!task.endDate) return false;
  const end = startOfDay(new Date(task.endDate));
  const today = startOfDay(now);
  switch (due.kind) {
    case "overdue":
      return end < today && task.status.type !== "done";
    case "today":
      return end.getTime() === today.getTime();
    case "week": {
      const monday = addDays(today, -((today.getDay() + 6) % 7));
      return end >= monday && end < addDays(monday, 7);
    }
    case "custom": {
      const from = parseLocalDate(due.from);
      const to = parseLocalDate(due.to);
      return (!from || end >= from) && (!to || end <= to);
    }
  }
}

export function filterTasks(tasks: Task[], f: ViewFilters, now = new Date()) {
  return tasks.filter(
    (t) =>
      (!f.assignees.length ||
        (f.assignees.includes(UNASSIGNED) && !t.assignees?.length) ||
        (t.assignees ?? []).some((a) => f.assignees.includes(a.id))) &&
      (!f.statuses.length || f.statuses.includes(t.statusId)) &&
      (!f.priorities.length || f.priorities.includes(t.priority)) &&
      (!f.tags.length || (t.tags ?? []).some((tag) => f.tags.includes(tag.id))) &&
      matchesDue(t, f.due, now),
  );
}

export interface TaskGroup {
  key: string;
  label: string;
  tasks: Task[];
  color?: string;
}

const PRIORITY_ORDER: Task["priority"][] = ["urgent", "high", "normal", "low", "none"];
const PRIORITY_LABEL: Record<Task["priority"], string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
  none: "No priority",
};

/** Groups for the non-status `groupBy` values. Tasks with several assignees/tags appear in each. */
export function groupTasks(tasks: Task[], groupBy: Exclude<GroupBy, "status">): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();
  const add = (key: string, label: string, task: Task, color?: string) => {
    const group = groups.get(key) ?? { key, label, tasks: [], color };
    group.tasks.push(task);
    groups.set(key, group);
  };

  for (const task of tasks) {
    if (groupBy === "priority") add(task.priority, PRIORITY_LABEL[task.priority], task);
    else if (groupBy === "assignee") {
      if (!task.assignees?.length) add(UNASSIGNED, "Unassigned", task);
      for (const a of task.assignees ?? []) add(a.id, a.name ?? a.email ?? "Guest", task);
    } else {
      if (!task.tags?.length) add(NO_TAG, "No tag", task);
      for (const tag of task.tags ?? []) add(tag.id, tag.name, task, tag.color);
    }
  }

  const list = [...groups.values()];
  if (groupBy === "priority") {
    return list.sort((a, b) => PRIORITY_ORDER.indexOf(a.key as Task["priority"]) - PRIORITY_ORDER.indexOf(b.key as Task["priority"]));
  }
  // Named groups alphabetically, the "nobody / nothing" bucket last.
  return list.sort((a, b) => {
    const aLast = a.key === UNASSIGNED || a.key === NO_TAG;
    const bLast = b.key === UNASSIGNED || b.key === NO_TAG;
    return aLast === bLast ? a.label.localeCompare(b.label) : aLast ? 1 : -1;
  });
}
