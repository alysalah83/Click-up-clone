import { z } from "zod";
import { idSchema } from "./common.js";

export const listNameSchema = z.string().trim().min(1).max(320);

export const createListSchema = z.object({ name: listNameSchema, workspaceId: idSchema });
export const updateListSchema = z.object({ name: listNameSchema.optional() });

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
