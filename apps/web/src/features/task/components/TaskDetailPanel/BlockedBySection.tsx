"use client";

import { useState } from "react";
import useTasks from "@/features/task/hooks/useTasks";
import {
  useDependencies,
  useDependencyMutations,
} from "@/features/task/hooks/useDependencies";
import { ICONS_MAP } from "@/shared/icons/icons-map";

/** "Blocked by" links of a task: list, remove, and add another task of the same list. */
function BlockedBySection({
  taskId,
  listId,
  onOpenTask,
}: {
  taskId: string;
  listId: string;
  onOpenTask: (taskId: string) => void;
}) {
  const { tasks } = useTasks();
  const { dependencies } = useDependencies(listId);
  const { addDependency, removeDependency } = useDependencyMutations(listId);
  const [picked, setPicked] = useState("");

  const blockedBy = dependencies.filter((d) => d.taskId === taskId);
  const linked = new Set(blockedBy.map((d) => d.dependsOnId));
  const nameOf = (id: string) => tasks?.find((t) => t.id === id)?.name ?? "Task";
  const candidates = (tasks ?? []).filter(
    (t) => t.id !== taskId && !linked.has(t.id),
  );

  return (
    <section aria-label="blocked by" className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
        Blocked by
      </h3>
      {blockedBy.length > 0 && (
        <ul className="flex flex-col gap-1">
          {blockedBy.map((d) => (
            <li
              key={d.dependsOnId}
              className="flex items-center justify-between gap-2 rounded-md bg-neutral-100 px-2.5 py-1.5 text-sm dark:bg-neutral-800"
            >
              <button
                type="button"
                onClick={() => onOpenTask(d.dependsOnId)}
                className="cursor-pointer truncate text-left hover:text-violet-600 hover:underline dark:hover:text-violet-300"
              >
                {nameOf(d.dependsOnId)}
              </button>
              <button
                type="button"
                aria-label={`remove link to ${nameOf(d.dependsOnId)}`}
                onClick={() => removeDependency(d)}
                className="cursor-pointer text-neutral-400 hover:text-red-500"
              >
                <ICONS_MAP.close className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <select
        aria-label="add blocking task"
        value={picked}
        onChange={(e) => {
          const dependsOnId = e.target.value;
          setPicked("");
          if (dependsOnId) addDependency({ taskId, dependsOnId });
        }}
        className="w-full cursor-pointer rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
      >
        <option value="">+ Add a blocking task...</option>
        {candidates.map((t) => (
          <option key={t.id} value={t.id} className="text-neutral-900">
            {t.name}
          </option>
        ))}
      </select>
    </section>
  );
}

export default BlockedBySection;
