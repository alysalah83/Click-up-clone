import { useQuery } from "@tanstack/react-query";
import { getTasksClient } from "../api/tasks.client";
import { TASK_REVALIDATE_TIME } from "../constants/tasks.const";
import { useTasksQueryKey } from "./useTasksQueryKey";

export default function useTasks() {
  const { listId, queryKey, sortedFilters } = useTasksQueryKey();

  const {
    data: tasks,
    isPending,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => getTasksClient(listId, sortedFilters),
    enabled: !!listId,
    staleTime: TASK_REVALIDATE_TIME,
  });

  return { tasks, isPending, error };
}
