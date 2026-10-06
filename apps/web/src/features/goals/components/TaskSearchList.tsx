"use client";

import { useState } from "react";
import { Check, CircleCheck, Search } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { useTaskSearch } from "../hooks";

/**
 * Searches the tasks of one space (the Ctrl+K search endpoint) and toggles them. Already
 * selected tasks show a check; clicking one calls `onToggle` with its id.
 */
function TaskSearchList({
  workspaceId,
  selectedIds,
  onToggle,
  disabled,
  className,
}: {
  workspaceId: string;
  selectedIds: Set<string>;
  onToggle: (taskId: string, selected: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const { data: tasks, isFetching, q } = useTaskSearch(workspaceId, query);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 dark:border-neutral-800">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks in this space..."
          aria-label="Search tasks"
          className="h-10 w-full bg-transparent text-sm outline-none"
        />
      </div>
      <ul role="listbox" aria-multiselectable className="max-h-64 overflow-auto p-1">
        {!q && <li className="px-3 py-5 text-center text-xs text-muted-foreground">Type to find tasks to link.</li>}
        {q && !tasks && (
          <li className="px-3 py-5 text-center text-xs text-muted-foreground">{isFetching ? "Searching..." : ""}</li>
        )}
        {q && tasks?.length === 0 && (
          <li className="px-3 py-5 text-center text-xs text-muted-foreground">No tasks match “{q}”.</li>
        )}
        {tasks?.map((task) => {
          const selected = selectedIds.has(task.id);
          return (
            <li key={task.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={disabled}
                onClick={() => onToggle(task.id, !selected)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-neutral-500/15 disabled:cursor-wait disabled:opacity-60"
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    selected ? "border-violet-600 bg-violet-600 text-white" : "border-neutral-400",
                  )}
                >
                  {selected && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate">{task.name}</span>
                {task.status.type === "done" && <CircleCheck aria-label="Done" className="size-3.5 text-emerald-500" />}
                <span className="max-w-28 shrink-0 truncate text-xs text-muted-foreground">{task.list.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TaskSearchList;
