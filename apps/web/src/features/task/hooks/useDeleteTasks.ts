"use client";

import { getSortedParamString } from "@/shared/lib/utils/getSortedParamString";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { deleteTasksAction } from "../actions";
import { Task } from "../types";
import { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

export function useDeleteTasks() {
  const { listId } = useParams<{ listId: string }>();

  const params = useSearchParams();
  const sortedFilters = getSortedParamString(params);
  const queryKey = sortedFilters
    ? ["tasks", listId, sortedFilters]
    : ["tasks", listId];

  const queryClient = useQueryClient();
  const { mutate: deleteTasks, status } = useMutation({
    mutationFn: async (tasksIdSet: Set<string>) => {
      const response = await deleteTasksAction({ listId, tasksIdSet });
      if (response.status === "error") throw response;
      return response;
    },

    onMutate(tasksIdSet: Set<string>) {
      queryClient.cancelQueries({ queryKey: ["tasks", listId] });

      const prevTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldTasks: Task[]) =>
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
      queryClient.invalidateQueries({
        queryKey: ["tasks", listId],
      });
    },
  });

  return { deleteTasks, status };
}
