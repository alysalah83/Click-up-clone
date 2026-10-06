import { z } from "zod";
import { idSchema } from "./common.js";
import { taskNameSchema } from "./task.js";

/**
 * A Tiptap (ProseMirror) JSON document: `{ type: "doc", content: [...] }`.
 * Only the root is checked; the editor owns the node schema. Size is capped by express.json.
 */
export const richTextDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .loose();

export const updateDescriptionSchema = z.object({
  description: richTextDocSchema.nullable(),
});

export const createSubtaskSchema = z.object({
  name: taskNameSchema,
  /** Defaults to the list's open status. */
  statusId: idSchema.optional(),
});

export const checklistNameSchema = z.string().trim().min(1).max(128);
export const checklistItemTextSchema = z.string().trim().min(1).max(256);

export const createChecklistSchema = z.object({
  name: checklistNameSchema.default("Checklist"),
});
export const updateChecklistSchema = z.object({ name: checklistNameSchema });

export const createChecklistItemSchema = z.object({
  text: checklistItemTextSchema,
});
export const updateChecklistItemSchema = z
  .object({
    text: checklistItemTextSchema.optional(),
    done: z.boolean().optional(),
    assigneeId: idSchema.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const tagNameSchema = z.string().trim().toLowerCase().min(1).max(32);
/** A color token from the web's ColorPicker (e.g. "violet") or a hex color. */
export const tagColorSchema = z
  .string()
  .regex(/^(#[0-9a-fA-F]{6}|[a-z]{3,16})$/);

export const createTagSchema = z.object({
  name: tagNameSchema,
  color: tagColorSchema,
});
export const updateTagSchema = z
  .object({ name: tagNameSchema.optional(), color: tagColorSchema.optional() })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const taskTagParamsSchema = z.object({ id: idSchema, tagId: idSchema });

export const ACTIVITY_TYPES = [
  "created",
  "status",
  "priority",
  "dates",
  "renamed",
  "assignee_added",
  "assignee_removed",
  "description",
  "subtask_added",
  "checklist_item_done",
  "tag_added",
  "automation",
  "recurred",
  "time_logged",
  "points",
  "sprint_carried",
  "attachment_added",
  "created_from_template",
  "submitted_via_form",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type RichTextDoc = z.infer<typeof richTextDocSchema>;
export type UpdateDescriptionInput = z.infer<typeof updateDescriptionSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
export type CreateChecklistItemInput = z.infer<
  typeof createChecklistItemSchema
>;
export type UpdateChecklistItemInput = z.infer<
  typeof updateChecklistItemSchema
>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
