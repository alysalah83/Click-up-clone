"use client";

import Link from "next/link";
import { Goal } from "lucide-react";
import { useTaskGoals } from "../hooks";
import { goalHex, percent } from "../lib";

/** Task panel row: the goals this task counts toward (hidden when there are none). */
function TaskGoalsRow({ taskId, statusId }: { taskId: string; statusId: string }) {
  const { data: goals } = useTaskGoals(taskId, statusId);
  if (!goals?.length) return null;
  return (
    <div className="flex min-h-9 items-center gap-2 sm:col-span-2">
      <span className="flex w-28 shrink-0 items-center gap-2 text-sm text-neutral-500">
        <Goal className="size-3.5" />
        Goals
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {goals.map((g) => (
          <Link
            key={g.id}
            href={`/home/goals/${g.id}`}
            className="flex max-w-full items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs hover:border-violet-400 dark:border-neutral-700"
          >
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: goalHex(g.color) }} />
            <span className="truncate">{g.name}</span>
            <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">{percent(g.progress)}%</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default TaskGoalsRow;
