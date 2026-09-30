import { z } from "zod";
import { booleanStringSchema, idSchema, optionalSortOrderSchema, prioritySchema } from "./common.js";

const optionalDateSchema = z.coerce.date().nullable().optional();

export const RECURRENCE_TYPES = ["none", "daily", "weekly", "monthly", "custom"] as const;
export const recurrenceTypeSchema = z.enum(RECURRENCE_TYPES);
/** "custom" repeats every N days. */
export const recurrenceIntervalSchema = z.number().int().min(1).max(365);

export const taskNameSchema = z.string().trim().min(1).max(128);

/** Fields a client may set when creating a task (without placement). */
export const taskFieldsSchema = z.object({
  name: taskNameSchema,
  priority: prioritySchema.default("none"),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

export const createTaskSchema = taskFieldsSchema.extend({ listId: idSchema, statusId: idSchema });

export const updateTaskSchema = z.object({
  name: taskNameSchema.optional(),
  statusId: idSchema.optional(),
  priority: prioritySchema.optional(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  recurrenceType: recurrenceTypeSchema.optional(),
  recurrenceInterval: recurrenceIntervalSchema.optional(),
});

export const bulkUpdateTasksSchema = z.object({
  tasksId: z.array(idSchema).min(1).max(500),
  updatedFields: updateTaskSchema,
});

/** The web app sends the ids array as the raw DELETE body. */
export const bulkDeleteTasksSchema = z.array(idSchema).min(1).max(500);

export const tasksQuerySchema = z.object({
  listId: idSchema.optional(),
  status: optionalSortOrderSchema,
  priority: optionalSortOrderSchema,
  dueDate: optionalSortOrderSchema,
  createdAt: optionalSortOrderSchema,
  count: booleanStringSchema.optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  cursor: idSchema.optional(),
});

export const priorityCountsQuerySchema = z.object({ listId: idSchema.optional() });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type BulkUpdateTasksInput = z.infer<typeof bulkUpdateTasksSchema>;
export type TasksQuery = z.infer<typeof tasksQuerySchema>;
export type RecurrenceType = z.infer<typeof recurrenceTypeSchema>;
