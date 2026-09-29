import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateTaskInput, Task } from "../types";
import { createTaskAction } from "../actions";
import { Status } from "@/features/status/types";
import type {
  ActionErrorResponse,
  ActionResponse,
} from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { useTasksQueryKey } from "./useTasksQueryKey";

export function useAddTask(taskStatusId: Task["statusId"]) {
  const { listId, queryKey, baseKey } = useTasksQueryKey();

  const queryClient = useQueryClient();

  const {
    mutate: addTask,
    error,
    status,
  } = useMutation({
    mutationFn: async (inputs: CreateTaskInput) => {
      const response = await createTaskAction(inputs);
      if (response?.status === "error") throw response;
      return response;
    },
    async onMutate(createTaskInputs: CreateTaskInput) {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousTasks = queryClient.getQueryData(queryKey);
      const currentStatuses = queryClient.getQueryData([
        "statuses",
        listId,
      ]) as Status[] | undefined;
      const taskStatus = currentStatuses?.find(
        (status) => status.id === taskStatusId,
      );

      const tempId = `temp-${Date.now()}-${Math.random()}-${Math.random()}`;
      queryClient.setQueryData(queryKey, (oldTasks: Task[] = []) => [
        ...oldTasks,
        {
          ...createTaskInputs,
          id: tempId,
          createdAt: new Date(),
          status: taskStatus,
        },
      ]);

      return { previousTasks, tempId };
    },

    onError(error: ActionErrorResponse, newTask, context) {
      if (context?.previousTasks)
        queryClient.setQueryData(queryKey, context.previousTasks);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },

    onSuccess(
      data: ActionResponse<{ newTask: Task }>,
      clientCreatedTask,
      context,
    ) {
      if (data.status === "success" && "payload" in data) {
        const { newTask } = data.payload;
        queryClient.setQueryData(queryKey, (oldOptimisticTasks: Task[] = []) =>
          oldOptimisticTasks.map((task) =>
            task.id === context.tempId ? newTask : task,
          ),
        );
        window.toast?.success(`Task (${newTask.name}) has been added`);
      }
    },

    onSettled() {
      queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
  return { addTask, error, status };
}
