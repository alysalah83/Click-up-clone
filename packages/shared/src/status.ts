import { z } from "zod";
import { idSchema } from "./common.js";

export const statusTypeSchema = z.enum(["open", "active", "done"]);

export const statusFieldsSchema = z.object({
  name: z.string().trim().min(1).max(320),
  icon: z.string().trim().min(1).max(64),
  iconColor: z.string().trim().min(1).max(32),
  bgColor: z.string().trim().min(1).max(32),
});

export const createStatusSchema = statusFieldsSchema.extend({ listId: idSchema });
/** Max tasks in a board column; null clears the limit. */
export const wipLimitSchema = z.number().int().min(1).max(999).nullable();
export const updateStatusSchema = statusFieldsSchema.partial().extend({ wipLimit: wipLimitSchema.optional() });

export type StatusType = z.infer<typeof statusTypeSchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
