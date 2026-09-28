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
export const updateStatusSchema = statusFieldsSchema.partial();

export type StatusType = z.infer<typeof statusTypeSchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
