"use client";

import { useState } from "react";
import { useUpdateTask } from "@/features/task/hooks/useUpdateTask";
import type { RecurrenceType, Task } from "@/features/task/types";

const OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Every N days..." },
];

const field =
  "cursor-pointer rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-200";

/** Repeat rule of the task: when it is completed, the next occurrence is created. */
function RepeatField({ task }: { task: Task }) {
  const { updateTask } = useUpdateTask();
  const type = task.recurrenceType ?? "none";
  const [days, setDays] = useState(String(task.recurrenceInterval ?? 1));

  const commitDays = () => {
    const n = Math.min(365, Math.max(1, Math.round(Number(days)) || 1));
    setDays(String(n));
    if (n !== task.recurrenceInterval)
      updateTask({ taskId: task.id, updateTaskInput: { recurrenceInterval: n } });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="repeat"
        value={type}
        onChange={(e) => {
          const recurrenceType = e.target.value as RecurrenceType;
          updateTask({
            taskId: task.id,
            updateTaskInput:
              recurrenceType === "custom"
                ? { recurrenceType, recurrenceInterval: Number(days) || 1 }
                : { recurrenceType },
          });
        }}
        className={field}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="text-neutral-900">
            {o.label}
          </option>
        ))}
      </select>
      {type === "custom" && (
        <label className="flex items-center gap-1.5 text-sm text-neutral-500">
          every
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            aria-label="repeat every days"
            onChange={(e) => setDays(e.target.value)}
            onBlur={commitDays}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className={`${field} w-16`}
          />
          days
        </label>
      )}
    </div>
  );
}

export default RepeatField;
