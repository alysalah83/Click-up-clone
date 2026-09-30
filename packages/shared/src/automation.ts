import { z } from "zod";
import { idSchema, prioritySchema } from "./common.js";

/** `to` is a status id, or "done" for any status of type done. */
export const automationTriggerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("status_changed"),
    to: z.union([z.literal("done"), idSchema]),
  }),
  z.object({ type: z.literal("task_created") }),
]);

export const automationActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("notify_assignees") }),
  z.object({ type: z.literal("assign_user"), userId: idSchema }),
  z.object({ type: z.literal("set_priority"), priority: prioritySchema }),
  z.object({ type: z.literal("set_status"), statusId: idSchema }),
]);

export const createAutomationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  trigger: automationTriggerSchema,
  actions: z.array(automationActionSchema).min(1).max(5),
});
export const updateAutomationSchema = z.object({ enabled: z.boolean() });

export type AutomationTrigger = z.infer<typeof automationTriggerSchema>;
export type AutomationAction = z.infer<typeof automationActionSchema>;
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
