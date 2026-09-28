import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { deleteStatus as deleteStatusAction } from "../actions/delete-status.action";
import { Status } from "../types";
import type { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";

export function useDeleteStatus() {
  const { listId } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();

  const { mutate: deleteStatus, isPending } = useMutation({
    mutationFn: async (statusId: Status["id"]) => {
      const response = await deleteStatusAction({ statusId, listId });
      if (response.status === "error") throw response;
      return response;
    },
    async onMutate(statusId: Status["id"]) {
      await queryClient.cancelQueries({ queryKey: ["statuses", listId] });
      const previousStatuses = queryClient.getQueryData<Status[]>([
        "statuses",
        listId,
      ]);

      queryClient.setQueryData(["statuses", listId], (oldStatuses: Status[]) =>
        oldStatuses
          ? oldStatuses.filter((status) => status.id !== statusId)
          : [],
      );

      return { previousStatuses };
    },

    onError(error: ActionErrorResponse, variables, onMutateResult) {
      if (onMutateResult?.previousStatuses)
        queryClient.setQueryData(
          ["statuses", listId],
          () => onMutateResult?.previousStatuses,
        );
      window.toast?.error(formatErrorForToast(error.error));
    },

    onSettled() {
      queryClient.invalidateQueries({ queryKey: ["statuses", listId] });
    },
  });

  return { deleteStatus, isPending };
}
