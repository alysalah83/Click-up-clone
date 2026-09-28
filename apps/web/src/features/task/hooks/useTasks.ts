import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { getSortedParamString } from "../../../shared/lib/utils/getSortedParamString";
import { Task } from "../types";
import { getTasksClient } from "../api/tasks.client";
import { TASK_REVALIDATE_TIME } from "../constants/tasks.const";

export default function useTasks() {
  const params = useSearchParams();
  const sortedFilters = getSortedParamString(params);
  const { listId } = useParams<{ listId: Task["listId"] }>();

  const {
    data: tasks,
    isPending,
    error,
  } = useQuery({
    queryKey: sortedFilters
      ? ["tasks", listId, sortedFilters]
      : ["tasks", listId],
    queryFn: () => getTasksClient(listId, sortedFilters),
    enabled: !!listId,
    staleTime: TASK_REVALIDATE_TIME,
  });

  if (error) window.toast?.error(error.message);

  return { tasks, isPending };
}
