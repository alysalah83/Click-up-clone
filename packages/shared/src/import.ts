import { z } from "zod";
import { idSchema, prioritySchema } from "./common.js";
import { listNameSchema } from "./list.js";
import { statusTypeSchema } from "./status.js";
import { taskNameSchema, taskPointsSchema } from "./task.js";
import { checklistItemTextSchema, checklistNameSchema, tagColorSchema, tagNameSchema } from "./taskDetail.js";
import { MAX_IMPORT_DESCRIPTION, MAX_IMPORT_TASKS } from "./importParse.js";

/**
 * POST /imports: a list created from a CSV file or a Trello board, already parsed and normalized
 * by the web app (see `importParse.ts`). Tasks reference statuses and tags by name.
 */
const importStatusSchema = z.object({
  name: z.string().trim().min(1).max(64),
  type: statusTypeSchema,
  color: z.string().regex(/^[a-z]{3,16}$/),
});

const importTaskSchema = z.object({
  name: taskNameSchema,
  description: z.string().max(MAX_IMPORT_DESCRIPTION).nullable().default(null),
  status: z.string().trim().min(1).max(64),
  priority: prioritySchema.default("none"),
  startDate: z.iso.datetime().nullable().default(null),
  dueDate: z.iso.datetime().nullable().default(null),
  assignees: z.array(z.string().trim().min(1).max(320)).max(10).default([]),
  tags: z.array(tagNameSchema).max(20).default([]),
  points: taskPointsSchema.default(null),
  checklists: z
    .array(
      z.object({
        name: checklistNameSchema,
        items: z.array(z.object({ text: checklistItemTextSchema, done: z.boolean().default(false) })).max(100).default([]),
      }),
    )
    .max(20)
    .default([]),
});

export const importPayloadSchema = z
  .object({
    workspaceId: idSchema,
    source: z.enum(["csv", "trello"]),
    listName: listNameSchema,
    statuses: z.array(importStatusSchema).min(2).max(30),
    tags: z.array(z.object({ name: tagNameSchema, color: tagColorSchema })).max(200).default([]),
    tasks: z.array(importTaskSchema).max(MAX_IMPORT_TASKS),
  })
  .superRefine((value, ctx) => {
    const names = value.statuses.map((s) => s.name.toLowerCase());
    if (new Set(names).size !== names.length)
      ctx.addIssue({ code: "custom", path: ["statuses"], message: "Status names must be unique" });
    for (const type of ["open", "done"] as const)
      if (value.statuses.filter((s) => s.type === type).length !== 1)
        ctx.addIssue({ code: "custom", path: ["statuses"], message: `Exactly one ${type} status is required` });
    const known = new Set(names);
    const missing = value.tasks.findIndex((t) => !known.has(t.status.toLowerCase()));
    if (missing >= 0)
      ctx.addIssue({ code: "custom", path: ["tasks", missing, "status"], message: "Unknown status" });
  });

export type ImportPayloadInput = z.infer<typeof importPayloadSchema>;
