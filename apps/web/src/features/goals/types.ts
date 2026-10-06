import type { Assignee } from "@/features/members/types";

/** Mirrors the goal DTO of the API (`goal.service.ts`); progress values are 0..1. */
export type GoalTargetType = "number" | "currency" | "boolean" | "tasks";

export type GoalColor = "violet" | "blue" | "emerald" | "amber" | "rose" | "cyan";

export type LinkedTask = {
  id: string;
  name: string;
  listId: string;
  points: number | null;
  done: boolean;
  status: { id: string; name: string; type: "open" | "active" | "done"; icon: string; iconColor: string };
};

export type GoalTarget = {
  id: string;
  name: string;
  type: GoalTargetType;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string | null;
  tasks: LinkedTask[];
  doneCount: number;
  progress: number;
};

export type Goal = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  color: GoalColor;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: Assignee | null;
  targets: GoalTarget[];
  progress: number;
};

export type GoalInput = {
  name?: string;
  description?: string;
  color?: GoalColor;
  ownerId?: string | null;
  dueDate?: string | null;
};

export type NewTargetInput = {
  name: string;
  type: GoalTargetType;
  startValue?: number;
  currentValue?: number;
  targetValue?: number;
  unit?: string | null;
  taskIds?: string[];
};

export type TaskGoalChip = { id: string; name: string; color: GoalColor; progress: number };

export type TaskSearchHit = {
  id: string;
  name: string;
  listId: string;
  list: { name: string; workspaceId: string };
  status: { name: string; type: "open" | "active" | "done" };
};
