"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Play, Square, Trash2 } from "lucide-react";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import SectionHeader from "@/features/taskDetail/components/SectionHeader";
import { formatClock, formatDuration, parseDuration } from "@/features/taskDetail/lib/duration";
import { useTaskTime, useTimeMutations } from "./useTaskTime";

/** Seconds since `startedAt`, ticking once a second while `active` (client-side, no polling). */
function useElapsed(startedAt: string | undefined, active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);
  return startedAt && active ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)) : 0;
}

/** Start/Stop timer with a live clock, the logged entries of the task and a manual "add time" input. */
function TimeTrackingSection({ taskId }: { taskId: string }) {
  const { time } = useTaskTime(taskId);
  const { start, stop, addManual, remove, busy } = useTimeMutations(taskId);
  const [manual, setManual] = useState("");

  const running = time?.running ?? null;
  const runningHere = running?.taskId === taskId;
  const elapsed = useElapsed(running?.startedAt, runningHere);
  const total = (time?.totalSec ?? 0) + elapsed;

  const submitManual = () => {
    const durationSec = parseDuration(manual);
    if (!durationSec) return window.toast?.error("Enter a time like 1h 30m, 45m or 1:30", 5);
    addManual(durationSec);
    setManual("");
  };

  return (
    <section aria-label="time tracking" className="flex flex-col gap-3">
      <SectionHeader title="Time tracking" count={total > 0 ? `${formatDuration(total)} total` : undefined} />

      <div className="flex flex-wrap items-center gap-2">
        {runningHere ? (
          <button
            type="button"
            aria-label="stop timer"
            disabled={busy}
            onClick={() => stop(running.id)}
            className="flex cursor-pointer items-center gap-2 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            <Square className="size-3.5 fill-current" />
            Stop
            <span className="tabular-nums" role="timer" aria-live="off">
              {formatClock(elapsed)}
            </span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="start timer"
            disabled={busy}
            onClick={() => start()}
            className="flex cursor-pointer items-center gap-2 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            <Play className="size-3.5 fill-current" />
            Start timer
          </button>
        )}
        <form
          className="flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            submitManual();
          }}
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            aria-label="add manual time"
            placeholder="Add time: 1h 30m"
            className="w-36 rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={!manual.trim()}
            className="cursor-pointer rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm hover:bg-neutral-100 disabled:cursor-default disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Add
          </button>
        </form>
      </div>
      {running && !runningHere && (
        <p className="text-xs text-neutral-500">
          A timer is running on &quot;{running.taskName}&quot;. Starting one here stops it.
        </p>
      )}

      {time && time.entries.length > 0 && (
        <ul className="flex flex-col gap-1">
          {time.entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 rounded-md bg-neutral-100 px-2.5 py-1.5 text-sm dark:bg-neutral-800"
            >
              <UserAvatar user={entry.user} size="xs" />
              <span className="min-w-0 flex-1 truncate text-neutral-600 dark:text-neutral-300">
                {displayName(entry.user)} · {format(new Date(entry.startedAt), "MMM d, h:mm a")}
              </span>
              <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-100">
                {entry.endedAt ? formatDuration(entry.durationSec ?? 0) : "running"}
              </span>
              <button
                type="button"
                aria-label="delete time entry"
                onClick={() => remove(entry.id)}
                className="cursor-pointer text-neutral-400 hover:text-red-500"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TimeTrackingSection;
