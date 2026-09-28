import { z } from "zod";
import { listNameSchema } from "./list.js";
import { statusFieldsSchema } from "./status.js";
import { taskFieldsSchema } from "./task.js";

export const avatarSchema = z.object({
  icon: z.string().trim().min(1).max(64),
  color: z.string().trim().min(1).max(32),
});

export const workspaceNameSchema = z.string().trim().min(1).max(320);

export const createWorkspaceSchema = z.object({ name: workspaceNameSchema, avatar: avatarSchema });

export const updateWorkspaceSchema = z.object({
  name: workspaceNameSchema.optional(),
  avatar: avatarSchema.partial().optional(),
});

/** Onboarding wizard: workspace + list + custom status + first task in one request. */
export const createWorkspaceFlowSchema = z.object({
  data: z.object({
    workspace: createWorkspaceSchema,
    list: z.object({ name: listNameSchema }),
    status: statusFieldsSchema,
    task: taskFieldsSchema,
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type CreateWorkspaceFlowInput = z.infer<typeof createWorkspaceFlowSchema>;
