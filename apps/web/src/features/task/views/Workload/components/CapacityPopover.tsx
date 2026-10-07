"use client";

import { useState } from "react";
import { Gauge } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/shared/lib/utils/cn";
import { DEFAULT_CAPACITY } from "../workload.lib";

interface CapacityPopoverProps {
  name: string;
  /** Saved per-day capacities (null = default). */
  tasks: number | null;
  points: number | null;
  /** Capacity shown on the trigger, already in the current measure. */
  label: string;
  onSave: (capacity: { capacityTasks: number | null; capacityPoints: number | null }) => void;
}

const parse = (value: string) => {
  const n = Number(value);
  return value.trim() === "" || !Number.isInteger(n) || n < 1 || n > 100 ? null : n;
};

/** Small "3/day" button on a row header that edits the person's capacity per day. */
export function CapacityPopover({ name, tasks, points, label, onSave }: CapacityPopoverProps) {
  const [open, setOpen] = useState(false);
  const [tasksValue, setTasksValue] = useState("");
  const [pointsValue, setPointsValue] = useState("");
  const custom = tasks !== null || points !== null;

  const input =
    "h-7 w-16 rounded-md border border-neutral-200 bg-transparent px-2 text-sm tabular-nums dark:border-neutral-700";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setTasksValue(tasks?.toString() ?? "");
          setPointsValue(points?.toString() ?? "");
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger
        aria-label={`Capacity of ${name}`}
        title="Edit capacity"
        className={cn(
          "inline-flex cursor-pointer items-center gap-0.5 rounded px-1 text-[11px] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
          custom && "text-violet-600 dark:text-violet-300",
        )}
      >
        <Gauge className="size-3" aria-hidden />
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <form
          className="flex flex-col gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ capacityTasks: parse(tasksValue), capacityPoints: parse(pointsValue) });
            setOpen(false);
          }}
        >
          <p className="font-semibold">Capacity of {name}</p>
          <p className="text-xs text-neutral-500">Per day. A week counts 5 working days.</p>
          <label className="flex items-center justify-between gap-2">
            Tasks per day
            <input
              type="number"
              min={1}
              max={100}
              value={tasksValue}
              placeholder={String(DEFAULT_CAPACITY.tasks)}
              onChange={(e) => setTasksValue(e.target.value)}
              className={input}
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            Points per day
            <input
              type="number"
              min={1}
              max={100}
              value={pointsValue}
              placeholder={String(DEFAULT_CAPACITY.points)}
              onChange={(e) => setPointsValue(e.target.value)}
              className={input}
            />
          </label>
          <div className="mt-1 flex items-center justify-between">
            <button
              type="button"
              disabled={!custom}
              onClick={() => {
                onSave({ capacityTasks: null, capacityPoints: null });
                setOpen(false);
              }}
              className="cursor-pointer text-xs text-neutral-500 hover:underline disabled:cursor-default disabled:opacity-40 disabled:no-underline"
            >
              Reset to default
            </button>
            <button type="submit" className="cursor-pointer rounded-md bg-violet-600 px-3 py-1 text-sm text-white">
              Save
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
