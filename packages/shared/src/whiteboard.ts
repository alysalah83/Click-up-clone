import { z } from "zod";
import { idSchema } from "./common.js";
import { taskNameSchema } from "./task.js";

const titleSchema = z.string().trim().max(200);
/** Serialized Excalidraw scene (elements, a little app state, embedded image files). */
export const whiteboardSceneSchema = z.string().max(1_500_000);

export const createWhiteboardSchema = z.object({
  workspaceId: idSchema,
  title: titleSchema.optional(),
  scene: whiteboardSceneSchema.optional(),
});
export const updateWhiteboardSchema = z.object({
  title: titleSchema.optional(),
  scene: whiteboardSceneSchema.optional(),
});
export const whiteboardsQuerySchema = z.object({ workspaceId: idSchema.optional() });
/** Turns a sticky note into a task in one of the board's lists (first status of that list). */
export const whiteboardTaskSchema = z.object({ listId: idSchema, name: taskNameSchema });

export type CreateWhiteboardInput = z.infer<typeof createWhiteboardSchema>;
export type UpdateWhiteboardInput = z.infer<typeof updateWhiteboardSchema>;
export type WhiteboardTaskInput = z.infer<typeof whiteboardTaskSchema>;
