import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { ApiError } from "@/shared/lib/errors";
import type {
  ActionErrorResponse,
  ActionResponse,
} from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import type { TaskDetail, TaskTag } from "../types";

export const taskDetailKey = (taskId: string) => ["task", taskId] as const;

export function useTaskDetail(taskId: string) {
  const {
    data: detail,
    isPending,
    error,
  } = useQuery<TaskDetail, ApiError>({
    queryKey: taskDetailKey(taskId),
    queryFn: () => axiosClient.get<TaskDetail>(`/api/tasks/${taskId}`),
    staleTime: 30 * 1000,
    retry: (count, err) => err.statusCode !== 404 && count < 2,
  });
  return { detail, isPending, error };
}

export function useWorkspaceTags(workspaceId: string) {
  const { data: tags } = useQuery({
    queryKey: ["tags", workspaceId],
    queryFn: () =>
      axiosClient.get<TaskTag[]>(`/api/workspaces/${workspaceId}/tags`),
    staleTime: 5 * 60 * 1000,
  });
  return tags ?? [];
}

/**
 * A write on the task page: optional optimistic edit of the cached detail, rollback on error,
 * then refetch the task pages and the list's tasks (for the card badges).
 */
export function useTaskDetailMutation<V>(
  taskId: string,
  listId: string,
  write: (variables: V) => Promise<ActionResponse>,
  optimistic?: (detail: TaskDetail, variables: V) => TaskDetail,
) {
  const queryClient = useQueryClient();
  const key = taskDetailKey(taskId);

  const { mutate, isPending } = useMutation({
    mutationFn: async (variables: V) => {
      const response = await write(variables);
      if (response.status === "error") throw response;
      return response;
    },
    async onMutate(variables) {
      if (!optimistic) return {};
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TaskDetail>(key);
      if (previous)
        queryClient.setQueryData(key, optimistic(previous, variables));
      return { previous };
    },
    onError(error: ActionErrorResponse, _variables, context) {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: ["task"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
    },
  });
  return { mutate, isPending };
}
