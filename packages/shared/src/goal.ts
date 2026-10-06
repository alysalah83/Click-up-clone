import { z } from "zod";
import { idSchema } from "./common.js";

/**
 * Goals (ClickUp OKRs): a goal in a space has targets (key results). Number and currency
 * targets move from `startValue` to `targetValue`; true/false targets are done at 1; task
 * targets are computed from their linked tasks' done-type statuses, so nothing drifts.
 */
export const GOAL_TARGET_TYPES = ["number", "currency", "boolean", "tasks"] as const;
export type GoalTargetType = (typeof GOAL_TARGET_TYPES)[number];

export const GOAL_COLORS = ["violet", "blue", "emerald", "amber", "rose", "cyan"] as const;
export type GoalColor = (typeof GOAL_COLORS)[number];

const nameSchema = z.string().trim().min(1).max(120);
const descriptionSchema = z.string().trim().max(2000);
const valueSchema = z.number().finite().min(-1e12).max(1e12);
const unitSchema = z.string().trim().max(12).nullable();
const dueDateSchema = z.coerce.date().nullable();

export const createGoalSchema = z.object({
  workspaceId: idSchema,
  name: nameSchema,
  description: descriptionSchema.optional(),
  color: z.enum(GOAL_COLORS).optional(),
  ownerId: idSchema.nullable().optional(),
  dueDate: dueDateSchema.optional(),
});
export const updateGoalSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  color: z.enum(GOAL_COLORS).optional(),
  ownerId: idSchema.nullable().optional(),
  dueDate: dueDateSchema.optional(),
});
export const goalsQuerySchema = z.object({ workspaceId: idSchema.optional() });

export const createGoalTargetSchema = z.object({
  name: nameSchema,
  type: z.enum(GOAL_TARGET_TYPES),
  startValue: valueSchema.optional(),
  currentValue: valueSchema.optional(),
  targetValue: valueSchema.optional(),
  unit: unitSchema.optional(),
  taskIds: z.array(idSchema).max(200).optional(),
});
export const updateGoalTargetSchema = z.object({
  name: nameSchema.optional(),
  startValue: valueSchema.optional(),
  currentValue: valueSchema.optional(),
  targetValue: valueSchema.optional(),
  unit: unitSchema.optional(),
});
export const goalTargetTasksSchema = z.object({ taskIds: z.array(idSchema).min(1).max(200) });

export const goalTargetParamsSchema = z.object({ id: idSchema, targetId: idSchema });
export const goalTargetTaskParamsSchema = z.object({ id: idSchema, targetId: idSchema, taskId: idSchema });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateGoalTargetInput = z.infer<typeof createGoalTargetSchema>;
export type UpdateGoalTargetInput = z.infer<typeof updateGoalTargetSchema>;

// ---------------------------------------------------------------------------------------------

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

export interface TargetProgressInput {
  type: GoalTargetType;
  startValue: number;
  currentValue: number;
  targetValue: number;
  /** Linked tasks (task targets only): done = its status is a done-type status. */
  tasks?: { done: boolean; points: number | null }[];
}

/**
 * Progress of one target, 0..1. Task targets weigh by points when every linked task has
 * points, else count tasks; no linked tasks is 0.
 */
export function targetProgress(target: TargetProgressInput): number {
  switch (target.type) {
    case "boolean":
      return target.currentValue >= 1 ? 1 : 0;
    case "tasks": {
      const tasks = target.tasks ?? [];
      if (tasks.length === 0) return 0;
      const byPoints = tasks.every((t) => (t.points ?? 0) > 0);
      const weight = (t: { points: number | null }) => (byPoints ? (t.points ?? 0) : 1);
      const total = tasks.reduce((sum, t) => sum + weight(t), 0);
      const done = tasks.reduce((sum, t) => sum + (t.done ? weight(t) : 0), 0);
      return clamp01(done / total);
    }
    default: {
      const { startValue, currentValue, targetValue } = target;
      if (targetValue === startValue) return currentValue >= targetValue ? 1 : 0;
      return clamp01((currentValue - startValue) / (targetValue - startValue));
    }
  }
}

/** A goal's progress, 0..1: the average of its targets' progress (0 without targets). */
export function goalProgress(targets: TargetProgressInput[]): number {
  if (targets.length === 0) return 0;
  return targets.reduce((sum, t) => sum + targetProgress(t), 0) / targets.length;
}
