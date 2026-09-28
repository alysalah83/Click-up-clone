import { COLORS_TOKENS } from "@/shared/ui/ColorPicker/colorTokens";
import z from "zod";

const createAvatarSchema = z.object({
  icon: z.string().trim(),
  color: z.enum(Object.keys(COLORS_TOKENS)),
});

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "name is required" })
    .max(320, { error: "name max length is 320 character" }),
  avatar: createAvatarSchema,
});

const updateWorkSpaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "name is required" })
    .max(320, { error: "name max length is 320 character" })
    .optional(),
  avatar: z
    .object({
      icon: z.string().trim().optional(),
      color: z.enum(Object.keys(COLORS_TOKENS)).optional(),
    })
    .optional(),
});

export { createWorkspaceSchema, updateWorkSpaceSchema, createAvatarSchema };
