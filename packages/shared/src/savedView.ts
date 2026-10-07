import { z } from "zod";
import { idSchema, prioritySchema } from "./common.js";

export const dueFilterSchema = z.object({
  kind: z.enum(["overdue", "today", "week", "none", "custom"]),
  /** ISO dates (YYYY-MM-DD), used by `custom`. */
  from: z.string().max(10).optional(),
  to: z.string().max(10).optional(),
});

/** A filter on a custom field; which ops apply depends on the field type (see the web filter bar). */
export const CUSTOM_FILTER_OPS = [
  "is",
  "is_not",
  "gt",
  "lt",
  "eq",
  "checked",
  "unchecked",
  "before",
  "after",
  "includes",
  "contains",
  "set",
  "empty",
] as const;
export const customFilterSchema = z.object({
  fieldId: z.string().max(64),
  op: z.enum(CUSTOM_FILTER_OPS),
  value: z.union([z.string().max(200), z.number(), z.array(z.string().max(64)).max(50)]).optional(),
});

/** Client-side sort by a custom field (built-in sorts live in the URL). */
export const viewSortSchema = z.object({ fieldId: z.string().max(64), dir: z.enum(["asc", "desc"]) });

export const savedViewConfigSchema = z.object({
  filters: z.object({
    assignees: z.array(z.string().max(64)).max(50).default([]),
    statuses: z.array(z.string().max(64)).max(50).default([]),
    priorities: z.array(prioritySchema).max(5).default([]),
    tags: z.array(z.string().max(64)).max(50).default([]),
    due: dueFilterSchema.nullable().default(null),
    custom: z.array(customFilterSchema).max(20).default([]),
  }),
  groupBy: z.enum(["status", "assignee", "priority", "tag"]).default("status"),
  /** Board swimlanes (ClickUp "Subgroup"): rows of the status board. */
  swimlanes: z.enum(["none", "assignee", "priority"]).default("none"),
  sort: viewSortSchema.nullable().default(null),
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

export type CustomFilter = z.infer<typeof customFilterSchema>;
export type CustomFilterOp = (typeof CUSTOM_FILTER_OPS)[number];
export type ViewSort = z.infer<typeof viewSortSchema>;
export type SavedViewConfig = z.infer<typeof savedViewConfigSchema>;
export type CreateSavedViewInput = z.infer<typeof createSavedViewSchema>;
export type UpdateSavedViewInput = z.infer<typeof updateSavedViewSchema>;
