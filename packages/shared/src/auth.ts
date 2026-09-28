import { z } from "zod";

export const emailSchema = z.email().max(100);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().trim().min(6).max(320),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(320),
});

export const updateMeSchema = z.object({ hasOnBoarded: z.boolean() });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
