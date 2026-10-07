import { useMemo } from "react";
import useTasks from "@/features/task/hooks/useTasks";
import { useTasksQueryKey } from "@/features/task/hooks/useTasksQueryKey";
import { useCustomFields } from "@/features/customFields/hooks";
import { filterByCustomFields, sortByCustomField } from "@/features/customFields/lib";
import { useListMembers } from "@/features/members/hooks/useMembers";
import { displayName } from "@/features/members/lib/avatar";
import { filterTasks } from "../lib/applyViewConfig";
import { useViewConfigStore } from "../store";

/** `useTasks()` narrowed by the current filter bar and sorted by a custom field (List, Board and Table views). */
export function useViewTasks() {
  const { listId } = useTasksQueryKey();
  const { tasks, isPending, error } = useTasks();
  const { fields } = useCustomFields(listId);
  const { members } = useListMembers(listId);
  const filters = useViewConfigStore((s) => s.filters);
  const groupBy = useViewConfigStore((s) => s.groupBy);
  const sort = useViewConfigStore((s) => s.sort);
  const filtered = useMemo(() => {
    if (!tasks) return tasks;
    const names = new Map((members ?? []).map((m) => [m.userId, displayName({ ...m, id: m.userId })]));
    const narrowed = filterByCustomFields(filterTasks(tasks, filters), filters.custom, fields);
    return sortByCustomField(narrowed, sort, fields, (id) => names.get(id) ?? id);
  }, [tasks, filters, fields, sort, members]);
  return { tasks: filtered, allTasks: tasks, isPending, error, groupBy };
}
