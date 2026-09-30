"use client";

import TaskItem from "@/features/task/views/Board/components/TaskItem";
import SkeletonLoader from "@/shared/ui/SkeletonLoader";
import { groupTasks } from "../lib/applyViewConfig";
import { useViewTasks } from "../hooks/useViewTasks";
import type { GroupBy } from "../types";

/** Board columns for assignee / priority / tag grouping. Read-only: cards can't be dragged between groups. */
function GroupedBoardColumns({ groupBy }: { groupBy: Exclude<GroupBy, "status"> }) {
  const { tasks, isPending } = useViewTasks();
  const groups = groupTasks(tasks ?? [], groupBy);

  return (
    <section className="min-h-0 flex-1 overflow-x-auto p-3 sm:p-4">
      <main className="flex h-full min-w-fit flex-col gap-4 lg:flex-row">
        {isPending && <SkeletonLoader height="h-22" width="w-full" count={6} />}
        {!isPending && groups.length === 0 && (
          <p className="text-sm text-neutral-500">No tasks match the current filters.</p>
        )}
        {groups.map((group) => (
          <div
            key={group.key}
            className="flex h-fit max-h-full w-2xs shrink-0 flex-col gap-1 overflow-y-auto rounded-xl bg-neutral-100 px-1.5 pt-2.5 pb-1.5 dark:bg-neutral-900"
          >
            <header className="flex items-center gap-3 px-1">
              <span className="text-sm font-semibold">{group.label}</span>
              <span className="text-sm text-neutral-600/80 dark:text-neutral-400/80">{group.tasks.length}</span>
            </header>
            <div className="flex flex-col gap-1 overflow-y-auto">
              {group.tasks.map((task) => (
                <TaskItem task={task} key={task.id} />
              ))}
            </div>
          </div>
        ))}
      </main>
    </section>
  );
}

export default GroupedBoardColumns;
