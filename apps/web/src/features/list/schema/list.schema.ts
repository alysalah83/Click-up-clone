import z from "zod";

const createListSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(320, "too long name"),
  workspaceId: z.string(),
});

const updateListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name is required")
    .max(320, "too long name")
    .optional(),
});

export { createListSchema, updateListSchema };
