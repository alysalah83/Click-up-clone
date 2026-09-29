import { useParams, useSearchParams } from "next/navigation";
import { getSortedParamString } from "@/shared/lib/utils/getSortedParamString";
import { Task } from "../types";

export function buildTasksQueryKey(
  listId: Task["listId"],
  sortedFilters: string | undefined,
) {
  return sortedFilters
    ? (["tasks", listId, sortedFilters] as const)
    : (["tasks", listId] as const);
}

export function useTasksQueryKey() {
  const { listId } = useParams<{ listId: Task["listId"] }>();
  const params = new URLSearchParams(useSearchParams());
  // `?task=<id>` only opens the task panel; it is not a tasks filter.
  params.delete("task");
  const sortedFilters = getSortedParamString(params);

  const baseKey = ["tasks", listId] as const;
  const queryKey = buildTasksQueryKey(listId, sortedFilters);

  return { listId, queryKey, baseKey, sortedFilters };
}
