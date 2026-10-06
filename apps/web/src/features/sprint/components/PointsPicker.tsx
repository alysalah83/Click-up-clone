"use client";

import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import { cn } from "@/shared/lib/utils/cn";
import { POINT_OPTIONS } from "../lib";

/** Small grey pill with the task's sprint points, as on ClickUp cards. */
export function PointsBadge({ points, className }: { points: number; className?: string }) {
  return (
    <span
      title={`${points} sprint point${points === 1 ? "" : "s"}`}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full border border-neutral-300 bg-neutral-100 px-1.5 text-[11px] font-semibold text-neutral-600 tabular-nums dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
        className,
      )}
    >
      <svg aria-hidden viewBox="0 0 12 12" className="size-2.5 fill-current opacity-70">
        <path d="M6 0.5 11 3.25v5.5L6 11.5 1 8.75v-5.5z" />
      </svg>
      {points}
    </span>
  );
}

/** Points picker (1, 2, 3, 5, 8, 13 or clear) for one task. `children` is the trigger content. */
function PointsPicker({
  taskId,
  points,
  children,
  className,
  align = "start",
}: {
  taskId: string;
  points: number | null | undefined;
  children?: ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
}) {
  const { updateTask } = useUpdateTask();
  const set = (value: number | null) => {
    if (value === (points ?? null)) return;
    updateTask({ taskId, updateTaskInput: { points: value } });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="change sprint points"
          className={cn("flex cursor-pointer items-center", className)}
        >
          {children ?? (points != null ? <PointsBadge points={points} /> : <span className="text-neutral-400">–</span>)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Sprint points</DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1 p-1">
          {POINT_OPTIONS.map((value) => (
            <DropdownMenuItem
              key={value}
              onSelect={() => set(value)}
              className={cn(
                "justify-center font-semibold tabular-nums",
                points === value && "bg-violet-500/15 text-violet-700 dark:text-violet-300",
              )}
            >
              {value}
            </DropdownMenuItem>
          ))}
        </div>
        {points != null && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => set(null)} className="text-muted-foreground">
              Clear points
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PointsPicker;
