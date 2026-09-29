import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTasksAction } from "../actions";
import { Task, UpdateTaskInput } from "../types";
import { Status } from "@/features/status/types";
import { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { useTasksQueryKey } from "./useTasksQueryKey";

export function useUpdateTasks() {
  const { listId, queryKey, baseKey } = useTasksQueryKey();

  const queryClient = useQueryClient();
  const {
    mutate: updateTasks,
    status,
    error,
  } = useMutation({
    mutationFn: async ({
      tasksId,
      updateTasksInput,
    }: {
      tasksId: Set<Task["id"]>;
      updateTasksInput: UpdateTaskInput;
    }) => {
      const response = await updateTasksAction(
        tasksId,
        updateTasksInput,
        listId,
      );
      if (response.status === "error") throw response;
      return response;
    },

    async onMutate({
      tasksId,
      updateTasksInput,
    }: {
      tasksId: Set<Task["id"]>;
      updateTasksInput: UpdateTaskInput;
    }) {
      await queryClient.cancelQueries({ queryKey: baseKey });

      const previousTasks = queryClient.getQueryData(queryKey);
      let updateTaskInputWithStatus: UpdateTaskInput & { status?: Status };

      if (updateTasksInput.statusId) {
        const statuses = queryClient.getQueryData<Status[]>([
          "statuses",
          listId,
        ]);
        const newUpdatedStatus = statuses?.find(
          (status) => status.id === updateTasksInput.statusId,
        );
        updateTaskInputWithStatus = {
          ...updateTasksInput,
          status: newUpdatedStatus,
        };
      } else updateTaskInputWithStatus = updateTasksInput;

      queryClient.setQueryData(queryKey, (oldTasks: Task[] = []) => {
        const newUpdatedTasks = oldTasks.map((task) =>
          tasksId.has(task.id)
            ? { ...task, ...updateTaskInputWithStatus }
            : task,
        );
        return newUpdatedTasks;
      });

      return { previousTasks };
    },

    onError(error: ActionErrorResponse, updatedTaskFields, context) {
      if (context?.previousTasks)
        queryClient.setQueryData(queryKey, context.previousTasks);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },

    onSettled() {
      queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
  return { updateTasks, status, error };
}
