import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { getSortedParamString } from "@/shared/lib/utils/getSortedParamString";
import { Task, UpdateTaskInput } from "../types";
import { updateTaskAction } from "../actions";
import { Status } from "@/features/status/types";
import { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

export function useUpdateTask() {
  const { listId } = useParams<{ listId: string }>();
  const params = useSearchParams();
  const sortedFilters = getSortedParamString(params);
  const queryKey = sortedFilters
    ? ["tasks", listId, sortedFilters]
    : ["tasks", listId];

  const queryClient = useQueryClient();
  const {
    mutate: updateTask,
    status,
    error,
  } = useMutation({
    mutationFn: async ({
      taskId,
      updateTaskInput,
    }: {
      taskId: string;
      updateTaskInput: UpdateTaskInput;
    }) => {
      const response = await updateTaskAction(taskId, updateTaskInput, listId);
      if (response.status === "error") throw response;
      return response;
    },

    async onMutate({
      taskId,
      updateTaskInput,
    }: {
      taskId: string;
      updateTaskInput: UpdateTaskInput;
    }) {
      await queryClient.cancelQueries({ queryKey: ["tasks", listId] });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      let updateTaskInputWithStatus: UpdateTaskInput & { status?: Status };

      if (updateTaskInput.statusId) {
        const statuses = queryClient.getQueryData<Status[]>([
          "statuses",
          listId,
        ]);
        const newUpdatedStatus = statuses?.find(
          (status) => status.id === updateTaskInput.statusId,
        );
        updateTaskInputWithStatus = {
          ...updateTaskInput,
          status: newUpdatedStatus,
        };
      } else updateTaskInputWithStatus = updateTaskInput;
      queryClient.setQueryData(queryKey, (oldTasks: Task[]) => {
        const updatedTaskIndex = oldTasks.findIndex(
          (task) => task.id === taskId,
        );
        if (updatedTaskIndex === -1) return oldTasks;
        return oldTasks.with(updatedTaskIndex, {
          ...oldTasks[updatedTaskIndex]!,
          ...updateTaskInputWithStatus,
        });
      });

      return { previousTasks };
    },

    onError(error: ActionErrorResponse, updatedTaskFields, context) {
      if (context?.previousTasks)
        queryClient.setQueryData(queryKey, context.previousTasks);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },

    onSettled() {
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
    },
  });
  return { updateTask, status, error };
}
