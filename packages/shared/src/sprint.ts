import { z } from "zod";
import { idSchema } from "./common.js";

export const SPRINT_STATES = ["planned", "active", "completed"] as const;
export type SprintState = (typeof SPRINT_STATES)[number];

/** Sprints last two weeks: start day + 13 days. */
export const SPRINT_LENGTH_DAYS = 14;

/** Creates the next sprint of a space (number, dates and statuses follow the latest sprint). */
export const createSprintSchema = z.object({ workspaceId: idSchema });

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
