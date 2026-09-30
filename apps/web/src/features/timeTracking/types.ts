/** Mirrors `TimeEntryDto` / `TaskTimeDto` in @clickup/shared. */
export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  user: { id: string; name: string | null; email: string | null; avatarColor: string | null };
}

export interface TaskTime {
  entries: TimeEntry[];
  totalSec: number;
  running: (TimeEntry & { taskName: string }) | null;
}
