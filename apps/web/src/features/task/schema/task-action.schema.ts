import z from "zod";

const createTaskSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(128, "too long name"),
  listId: z.string("no listId provided"),
  statusId: z.string(""),
  priority: z
    .enum(["urgent", "high", "normal", "low", "none"])
    .default("none")
    .optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

const updateTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(128, "too long name")
    .optional(),
  statusId: z.string().optional(),
  priority: z.enum(["urgent", "high", "normal", "low", "none"]).optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
});

export { createTaskSchema, updateTaskSchema };
