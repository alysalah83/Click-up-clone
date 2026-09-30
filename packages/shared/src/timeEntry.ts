import { z } from "zod";
import { idSchema } from "./common.js";

/** A manual entry is at most 31 days, so a typo cannot wreck the dashboard totals. */
export const MAX_MANUAL_SECONDS = 31 * 24 * 60 * 60;

export const timeEntriesQuerySchema = z.object({ taskId: idSchema });
export const startTimerSchema = z.object({ taskId: idSchema });
export const createManualTimeEntrySchema = z.object({
  taskId: idSchema,
  durationSec: z.number().int().min(1).max(MAX_MANUAL_SECONDS),
});

export const timeEntryParamsSchema = z.object({ id: idSchema });

export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type CreateManualTimeEntryInput = z.infer<typeof createManualTimeEntrySchema>;

export interface TimeEntryDto {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  /** Null while the timer runs. */
  endedAt: string | null;
  /** Null while the timer runs. */
  durationSec: number | null;
  user: { id: string; name: string | null; email: string | null; avatarColor: string | null };
}

/** GET /api/tasks/:id/time-entries */
export interface TaskTimeDto {
  entries: TimeEntryDto[];
  /** Finished entries of everyone on this task (the running timer is counted client-side). */
  totalSec: number;
  /** The caller's running timer, on this task or another one. */
  running: (TimeEntryDto & { taskName: string }) | null;
}
