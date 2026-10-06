import { z } from "zod";
import { idSchema, prioritySchema } from "./common.js";
import { taskNameSchema, taskPointsSchema } from "./task.js";
import {
  checklistItemTextSchema,
  checklistNameSchema,
  richTextDocSchema,
  tagColorSchema,
  tagNameSchema,
} from "./taskDetail.js";

/**
 * Task templates (ClickUp "Save as template"): a snapshot of a task with its subtasks and
 * checklists, stored as JSON on the template and validated by `taskTemplateSnapshotSchema`.
 * Tags are kept by name and color, so applying a template in another space reuses (or creates)
 * that space's tag. The due date is relative: "due in N days" from the day the task is created.
 */

export const MAX_TEMPLATE_DUE_DAYS = 365;

export const taskTemplateSnapshotSchema = z.object({
  name: taskNameSchema,
  description: richTextDocSchema.nullable().default(null),
  priority: prioritySchema.default("none"),
  points: taskPointsSchema.default(null),
  tags: z.array(z.object({ name: tagNameSchema, color: tagColorSchema })).max(20).default([]),
  dueInDays: z.number().int().min(0).max(MAX_TEMPLATE_DUE_DAYS).nullable().default(null),
  subtasks: z
    .array(z.object({ name: taskNameSchema, priority: prioritySchema.default("none") }))
    .max(50)
    .default([]),
  checklists: z
    .array(z.object({ name: checklistNameSchema, items: z.array(checklistItemTextSchema).max(100).default([]) }))
    .max(20)
    .default([]),
});

const templateNameSchema = z.string().trim().min(1).max(80);
const templateDescriptionSchema = z.string().trim().max(280);

/** POST /task-templates/from-task: snapshot an existing task (with subtasks and checklists). */
export const saveTaskAsTemplateSchema = z.object({
  taskId: idSchema,
  name: templateNameSchema,
  description: templateDescriptionSchema.optional(),
});

export const updateTaskTemplateSchema = z
  .object({ name: templateNameSchema.optional(), description: templateDescriptionSchema.optional() })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

/** POST /task-templates/:id/apply: create a task in this list and status. */
export const applyTaskTemplateSchema = z.object({
  listId: idSchema,
  statusId: idSchema,
  /** Overrides the snapshot's task name. */
  name: taskNameSchema.optional(),
});

export const taskTemplatesQuerySchema = z.object({ workspaceId: idSchema.optional() });

export type TaskTemplateSnapshot = z.infer<typeof taskTemplateSnapshotSchema>;
export type SaveTaskAsTemplateInput = z.infer<typeof saveTaskAsTemplateSchema>;
export type UpdateTaskTemplateInput = z.infer<typeof updateTaskTemplateSchema>;
export type ApplyTaskTemplateInput = z.infer<typeof applyTaskTemplateSchema>;

// ---------------------------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const utcDay = (date: Date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

/**
 * The relative due date a template keeps: whole UTC days from the task's creation day to its due
 * day. Null without a due date or when it was due before it was created.
 */
export function dueOffsetDays(createdAt: Date, endDate: Date | null): number | null {
  if (!endDate) return null;
  const days = Math.round((utcDay(endDate) - utcDay(createdAt)) / DAY_MS);
  return days < 0 ? null : Math.min(days, MAX_TEMPLATE_DUE_DAYS);
}

/** 12:00 UTC `days` after `now`'s UTC day, the calendar-day convention of task dates. */
export function dueDateFromOffset(now: Date, days: number): Date {
  return new Date(utcDay(now) + days * DAY_MS + 12 * 60 * 60 * 1000);
}
