import { z } from "zod";
import { idSchema, prioritySchema } from "./common.js";

export const dueFilterSchema = z.object({
  kind: z.enum(["overdue", "today", "week", "none", "custom"]),
  /** ISO dates (YYYY-MM-DD), used by `custom`. */
  from: z.string().max(10).optional(),
  to: z.string().max(10).optional(),
});

export const savedViewConfigSchema = z.object({
  filters: z.object({
    assignees: z.array(z.string().max(64)).max(50).default([]),
    statuses: z.array(z.string().max(64)).max(50).default([]),
    priorities: z.array(prioritySchema).max(5).default([]),
    tags: z.array(z.string().max(64)).max(50).default([]),
    due: dueFilterSchema.nullable().default(null),
  }),
  groupBy: z.enum(["status", "assignee", "priority", "tag"]).default("status"),
  /** Board swimlanes (ClickUp "Subgroup"): rows of the status board. */
  swimlanes: z.enum(["none", "assignee", "priority"]).default("none"),
});

const nameSchema = z.string().trim().min(1).max(80);

export const createSavedViewSchema = z.object({
  listId: idSchema,
  name: nameSchema,
  config: savedViewConfigSchema,
  isDefault: z.boolean().optional(),
});
export const updateSavedViewSchema = z.object({
  name: nameSchema.optional(),
  config: savedViewConfigSchema.optional(),
  isDefault: z.boolean().optional(),
});

export type SavedViewConfig = z.infer<typeof savedViewConfigSchema>;
export type CreateSavedViewInput = z.infer<typeof createSavedViewSchema>;
export type UpdateSavedViewInput = z.infer<typeof updateSavedViewSchema>;
