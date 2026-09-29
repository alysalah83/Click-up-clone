import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/features/task/types";
import { useTasksQueryKey } from "@/features/task/hooks/useTasksQueryKey";
import type { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { setTaskAssigneesAction } from "../actions/members.actions";
import type { Assignee } from "../types";

/** Replaces a task's assignees, updating the cached task list optimistically. */
export function useSetAssignees() {
  const { listId, queryKey, baseKey } = useTasksQueryKey();
  const queryClient = useQueryClient();

  const { mutate: setAssignees } = useMutation({
    mutationFn: async ({ taskId, assignees }: { taskId: string; assignees: Assignee[] }) => {
      const response = await setTaskAssigneesAction(
        taskId,
        assignees.map((a) => a.id),
        listId,
      );
      if (response.status === "error") throw response;
      return response;
    },

    async onMutate({ taskId, assignees }) {
      await queryClient.cancelQueries({ queryKey: baseKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData(queryKey, (oldTasks: Task[] = []) =>
        oldTasks.map((task) => (task.id === taskId ? { ...task, assignees } : task)),
      );
      return { previousTasks };
    },

    onError(error: ActionErrorResponse, _variables, context) {
      if (context?.previousTasks) queryClient.setQueryData(queryKey, context.previousTasks);
      window.toast?.error(formatErrorForToast(error.error), 7);
    },

    onSettled() {
      queryClient.invalidateQueries({ queryKey: baseKey });
      queryClient.invalidateQueries({ queryKey: ["members", "people"] });
    },
  });

  return { setAssignees };
}
