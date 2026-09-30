import { z } from "zod";
import { idSchema } from "./common.js";

/** `taskId` is blocked by `dependsOnId`. */
export const taskDependencySchema = z.object({ taskId: idSchema, dependsOnId: idSchema });
export const dependenciesQuerySchema = z.object({ listId: idSchema });
export const dependencyParamsSchema = taskDependencySchema;

export type TaskDependencyInput = z.infer<typeof taskDependencySchema>;
export type TaskDependencyDto = { taskId: string; dependsOnId: string };
