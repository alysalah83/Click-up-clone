"use client";

import { useState } from "react";
import Link from "next/link";
import { Circle, CircleCheck, Ellipsis, Link2, Trash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDeleteTarget, useLinkTasks, useUnlinkTask, useUpdateTarget } from "../hooks";
import { formatValue, percent, targetSummary } from "../lib";
import type { GoalTarget } from "../types";
import { ProgressBar } from "./GoalProgress";
import TargetTypeIcon from "./TargetTypeIcon";
import TaskSearchList from "./TaskSearchList";

/** Inline current-value editor for number/currency targets: saves on Enter or blur. */
function ValueInput({ goalId, target }: { goalId: string; target: GoalTarget }) {
  const update = useUpdateTarget(goalId);
  const [value, setValue] = useState(String(target.currentValue));
  const [synced, setSynced] = useState(target.currentValue);
  // Server updates (another edit, a refetch) replace the draft.
  if (synced !== target.currentValue) {
    setSynced(target.currentValue);
    setValue(String(target.currentValue));
  }

  const commit = () => {
    const next = Number(value);
    if (value.trim() === "" || isNaN(next)) return setValue(String(target.currentValue));
    if (next !== target.currentValue) update.mutate({ targetId: target.id, currentValue: next });
  };

  return (
    <span className="flex items-center gap-1 text-sm tabular-nums">
      {target.type === "currency" && <span className="text-muted-foreground">{target.unit ?? "$"}</span>}
      <input
        type="number"
        step="any"
        inputMode="decimal"
        aria-label={`${target.name} current value`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(String(target.currentValue));
            e.currentTarget.blur();
          }
        }}
        className="w-24 rounded-md border border-transparent bg-neutral-100 px-2 py-1 text-right outline-none hover:border-neutral-300 focus:border-violet-500 focus:bg-transparent dark:bg-neutral-800 dark:hover:border-neutral-600"
      />
      <span className="text-muted-foreground">/ {formatValue(target.targetValue, target.type, target.unit)}</span>
    </span>
  );
}

function LinkTasksButton({ goalId, workspaceId, target }: { goalId: string; workspaceId: string; target: GoalTarget }) {
  const link = useLinkTasks(goalId);
  const unlink = useUnlinkTask(goalId);
  const selected = new Set(target.tasks.map((t) => t.id));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="xs" variant="ghost" className="text-muted-foreground">
          <Link2 /> Link tasks
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <TaskSearchList
          workspaceId={workspaceId}
          selectedIds={selected}
          disabled={link.isPending || unlink.isPending}
          onToggle={(taskId, isSelected) =>
            isSelected
              ? link.mutate({ targetId: target.id, taskIds: [taskId] })
              : unlink.mutate({ targetId: target.id, taskId })
          }
        />
      </PopoverContent>
    </Popover>
  );
}

function LinkedTasks({ goalId, target }: { goalId: string; target: GoalTarget }) {
  const unlink = useUnlinkTask(goalId);
  const [showAll, setShowAll] = useState(false);
  if (target.tasks.length === 0)
    return <p className="px-1 text-xs text-muted-foreground">No linked tasks yet. Link tasks to measure this target.</p>;
  const LIMIT = 8;
  const shown = showAll ? target.tasks : target.tasks.slice(0, LIMIT);
  return (
    <ul className="flex flex-col">
      {shown.map((task) => (
        <li key={task.id} className="group flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-neutral-500/10">
          {task.done ? (
            <CircleCheck aria-label="Done" className="size-4 shrink-0 text-emerald-500" />
          ) : (
            <Circle aria-label="Not done" className="size-4 shrink-0 text-neutral-400" />
          )}
          <Link
            href={`/home/lists/${task.listId}/board?task=${task.id}`}
            className={`min-w-0 flex-1 truncate hover:underline ${task.done ? "text-muted-foreground line-through" : ""}`}
          >
            {task.name}
          </Link>
          <span className="hidden shrink-0 text-xs text-muted-foreground capitalize sm:inline">{task.status.name}</span>
          {task.points != null && (
            <span className="shrink-0 rounded bg-neutral-200 px-1.5 text-[11px] font-medium tabular-nums dark:bg-neutral-800">
              {task.points} pt{task.points === 1 ? "" : "s"}
            </span>
          )}
          <button
            type="button"
            aria-label={`Unlink ${task.name}`}
            title="Unlink task"
            disabled={unlink.isPending}
            onClick={() => unlink.mutate({ targetId: target.id, taskId: task.id })}
            className="shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-neutral-500/20 hover:text-foreground focus-visible:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </li>
      ))}
      {target.tasks.length > LIMIT && (
        <li>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="cursor-pointer px-1 py-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            {showAll ? "Show less" : `Show all ${target.tasks.length} tasks`}
          </button>
        </li>
      )}
    </ul>
  );
}

/** One target: type, name, inline progress editing, progress bar; task targets list their tasks. */
function TargetRow({
  goalId,
  workspaceId,
  target,
  color,
}: {
  goalId: string;
  workspaceId: string;
  target: GoalTarget;
  color: string;
}) {
  const update = useUpdateTarget(goalId);
  const remove = useDeleteTarget(goalId);
  const pct = percent(target.progress);

  return (
    <li className="flex flex-col gap-2.5 rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          <TargetTypeIcon type={target.type} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{target.name}</span>

        {(target.type === "number" || target.type === "currency") && <ValueInput goalId={goalId} target={target} />}
        {target.type === "boolean" && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={target.currentValue >= 1}
              disabled={update.isPending}
              onCheckedChange={(checked) => update.mutate({ targetId: target.id, currentValue: checked === true ? 1 : 0 })}
              className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
            />
            {targetSummary(target)}
          </label>
        )}
        {target.type === "tasks" && (
          <span className="text-sm text-muted-foreground tabular-nums">{targetSummary(target)}</span>
        )}

        <span className="w-10 text-right text-sm font-semibold tabular-nums">{pct}%</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-xs" variant="ghost" aria-label={`${target.name} options`}>
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              disabled={remove.isPending}
              onSelect={() => remove.mutate(target.id)}
            >
              <Trash /> Delete target
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ProgressBar progress={target.progress} color={color} />
      {target.type === "tasks" && (
        <div className="flex flex-col gap-1 border-t border-neutral-100 pt-2 dark:border-neutral-800">
          <LinkedTasks goalId={goalId} target={target} />
          <div>
            <LinkTasksButton goalId={goalId} workspaceId={workspaceId} target={target} />
          </div>
        </div>
      )}
    </li>
  );
}

export default TargetRow;
