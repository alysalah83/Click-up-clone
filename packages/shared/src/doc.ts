import { z } from "zod";
import { idSchema } from "./common.js";

const titleSchema = z.string().trim().max(200);
/** Tiptap JSON, serialized. */
const contentSchema = z.string().max(500_000);
const iconSchema = z.string().trim().max(16).nullable();

export const createDocSchema = z.object({
  workspaceId: idSchema,
  parentId: idSchema.nullable().optional(),
  title: titleSchema.optional(),
  icon: iconSchema.optional(),
  content: contentSchema.optional(),
});
export const updateDocSchema = z.object({
  title: titleSchema.optional(),
  icon: iconSchema.optional(),
  content: contentSchema.optional(),
  parentId: idSchema.nullable().optional(),
});
export const docsQuerySchema = z.object({ workspaceId: idSchema.optional() });

export type CreateDocInput = z.infer<typeof createDocSchema>;
export type UpdateDocInput = z.infer<typeof updateDocSchema>;
