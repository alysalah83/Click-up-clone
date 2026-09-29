"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTasksAction } from "../actions";
import { Task } from "../types";
import { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { useTasksQueryKey } from "./useTasksQueryKey";

export function useDeleteTasks() {
  const { listId, queryKey, baseKey } = useTasksQueryKey();

  const queryClient = useQueryClient();
  const { mutate: deleteTasks, status } = useMutation({
    mutationFn: async (tasksIdSet: Set<string>) => {
      const response = await deleteTasksAction({ listId, tasksIdSet });
      if (response.status === "error") throw response;
      return response;
    },

    async onMutate(tasksIdSet: Set<string>) {
      await queryClient.cancelQueries({ queryKey: baseKey });

      const prevTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldTasks: Task[] = []) =>
        oldTasks.filter((task) => !tasksIdSet.has(task.id)),
      );

      return { prevTasks };
    },

    onError(error: ActionErrorResponse, variables, context) {
      if (context?.prevTasks)
        queryClient.setQueryData(queryKey, context.prevTasks);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },

    onSettled() {
      queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });

  return { deleteTasks, status };
}
