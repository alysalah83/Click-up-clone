import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTaskAction } from "../actions";
import { Task } from "../types";
import type {
  ActionResponse,
  ActionErrorResponse,
} from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { useTasksQueryKey } from "./useTasksQueryKey";

export function useDeleteTask() {
  const { listId, queryKey, baseKey } = useTasksQueryKey();

  const queryClient = useQueryClient();
  const {
    mutate: deleteTask,
    status,
    error,
  } = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const response = await deleteTaskAction(taskId, listId);
      if (response.status === "error") throw response;
      return response;
    },

    async onMutate({ taskId }: { taskId: string }) {
      await queryClient.cancelQueries({ queryKey: baseKey });

      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldTasks: Task[]) => {
        if (!oldTasks) return [];
        return oldTasks.filter((task) => task.id !== taskId);
      });

      return { previousTasks };
    },

    onError(error: ActionErrorResponse, variables, context) {
      if (context?.previousTasks)
        queryClient.setQueryData(queryKey, context.previousTasks);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },

    onSuccess(data: ActionResponse<{ task: Task }>) {
      if ("payload" in data && data.status === "success")
        window.toast?.success(
          `Task (${data.payload.task.name}) has been deleted`,
        );
    },

    onSettled() {
      queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
  return { deleteTask, status, error };
}
