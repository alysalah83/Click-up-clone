import type { Task } from "@/features/task/types";
import type { Assignee } from "@/features/members/types";
import { displayName } from "@/features/members/lib/avatar";
import { UNASSIGNED } from "@/features/viewConfig/lib/applyViewConfig";
import type { Swimlanes } from "@/features/viewConfig/types";

export const NO_PRIORITY_LANE = "none";

export interface Lane {
  key: string;
  label: string;
  /** Set on assignee lanes (not on "Unassigned"). */
  assignee?: Assignee;
  /** Set on priority lanes. */
  priority?: Task["priority"];
  tasks: Task[];
  points: number;
}

const PRIORITY_ORDER: Task["priority"][] = ["urgent", "high", "normal", "low", "none"];
const PRIORITY_LABEL: Record<Task["priority"], string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
  none: "No priority",
};

/**
 * Board rows for swimlanes. A task with several assignees appears in each of their lanes (like ClickUp);
 * named lanes come first (alphabetically / by priority), "Unassigned" and "No priority" last.
 */
export function buildLanes(tasks: Task[], mode: Exclude<Swimlanes, "none">): Lane[] {
  const lanes = new Map<string, Lane>();
  const add = (key: string, init: Omit<Lane, "tasks" | "points" | "key">, task: Task) => {
    const lane = lanes.get(key) ?? { key, ...init, tasks: [], points: 0 };
    lane.tasks.push(task);
    lane.points += task.points ?? 0;
    lanes.set(key, lane);
  };

  for (const task of tasks) {
    if (mode === "priority") {
      add(task.priority, { label: PRIORITY_LABEL[task.priority], priority: task.priority }, task);
    } else if (!task.assignees?.length) {
      add(UNASSIGNED, { label: "Unassigned" }, task);
    } else {
      for (const a of task.assignees) add(a.id, { label: displayName(a), assignee: a }, task);
    }
  }

  const list = [...lanes.values()];
  if (mode === "priority") {
    return list.sort((a, b) => PRIORITY_ORDER.indexOf(a.priority!) - PRIORITY_ORDER.indexOf(b.priority!));
  }
  return list.sort((a, b) => {
    const aLast = a.key === UNASSIGNED;
    const bLast = b.key === UNASSIGNED;
    return aLast === bLast ? a.label.localeCompare(b.label) : aLast ? 1 : -1;
  });
}

/** Where a card was dragged from / dropped on. `laneKey` is only set on swimlane boards. */
export interface BoardDropPoint {
  statusId: string;
  laneKey?: string;
}

export interface BoardMove {
  /** New status, when the column changed. */
  statusId?: string;
  /** Lane change, when the card moved to another swimlane. */
  lane?: { from: string; to: string };
}

/** What a drop changes; null when the card was dropped on nothing or back where it was. */
export function resolveBoardDrop(from: BoardDropPoint, to: BoardDropPoint | null | undefined): BoardMove | null {
  if (!to) return null;
  const move: BoardMove = {};
  if (to.statusId !== from.statusId) move.statusId = to.statusId;
  if (from.laneKey !== undefined && to.laneKey !== undefined && to.laneKey !== from.laneKey) {
    move.lane = { from: from.laneKey, to: to.laneKey };
  }
  return move.statusId || move.lane ? move : null;
}

/**
 * Assignees after moving a card from one assignee lane to another: the old lane's person is replaced by
 * the new lane's one ("Unassigned" as target removes the old person; as source it just adds the new one).
 */
export function moveAssignee(
  assignees: Assignee[],
  fromKey: string,
  to: Assignee | null,
): Assignee[] {
  const kept = assignees.filter((a) => a.id !== fromKey && a.id !== to?.id);
  return to ? [...kept, to] : kept;
}

/** Droppable / draggable ids of swimlane cells and cards (a card may sit in several lanes). */
export const cellId = (statusId: string, laneKey: string) => `cell:${statusId}:${laneKey}`;
export const laneCardId = (taskId: string, laneKey: string) => `${taskId}::${laneKey}`;

export type WipState = "none" | "ok" | "full" | "exceeded";

/** WIP state of a column: `full` at the limit, `exceeded` over it. */
export function wipState(count: number, limit: number | null | undefined): WipState {
  if (!limit) return "none";
  if (count > limit) return "exceeded";
  return count === limit ? "full" : "ok";
}

/** True when dropping one more card into the column takes it over its limit. */
export function dropExceedsWip(countBefore: number, limit: number | null | undefined) {
  return !!limit && countBefore + 1 > limit;
}
