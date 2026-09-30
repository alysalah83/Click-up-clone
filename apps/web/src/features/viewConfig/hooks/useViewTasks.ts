import { useMemo } from "react";
import useTasks from "@/features/task/hooks/useTasks";
import { filterTasks } from "../lib/applyViewConfig";
import { useViewConfigStore } from "../store";

/** `useTasks()` narrowed by the current filter bar (List, Board and Table views). */
export function useViewTasks() {
  const { tasks, isPending, error } = useTasks();
  const filters = useViewConfigStore((s) => s.filters);
  const groupBy = useViewConfigStore((s) => s.groupBy);
  const filtered = useMemo(() => (tasks ? filterTasks(tasks, filters) : tasks), [tasks, filters]);
  return { tasks: filtered, allTasks: tasks, isPending, error, groupBy };
}
