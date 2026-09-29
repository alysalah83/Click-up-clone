import { z } from "zod";
import { idSchema } from "./common.js";

export const memberRoleSchema = z.enum(["owner", "admin", "member", "guest"]);
/** Roles that can be granted (there is exactly one owner per workspace). */
export const assignableRoleSchema = z.enum(["admin", "member", "guest"]);

export const workspaceMemberParamsSchema = z.object({ id: idSchema, userId: idSchema });

export const updateMemberRoleSchema = z.object({ role: assignableRoleSchema });

export const setAssigneesSchema = z.object({ userIds: z.array(idSchema).max(50) });

export const createInviteSchema = z.object({ role: assignableRoleSchema.default("member") });

export const inviteTokenParamsSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
});

export type MemberRole = z.infer<typeof memberRoleSchema>;
export type AssignableRole = z.infer<typeof assignableRoleSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type SetAssigneesInput = z.infer<typeof setAssigneesSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
