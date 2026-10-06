import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import type { ActionErrorResponse } from "@/shared/types/action.types";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import { setWipLimitAction } from "../actions/set-wip-limit.action";
import { Status } from "../types";

/** Sets or clears (null) a board column's WIP limit, updating the cached statuses optimistically. */
export function useSetWipLimit() {
  const { listId } = useParams<{ listId: string }>();
  const queryClient = useQueryClient();
  const key = ["statuses", listId];

  const { mutate: setWipLimit, isPending } = useMutation({
    mutationFn: async ({ statusId, wipLimit }: { statusId: Status["id"]; wipLimit: number | null }) => {
      const response = await setWipLimitAction({ statusId, listId, wipLimit });
      if (response.status === "error") throw response;
      return response;
    },
    async onMutate({ statusId, wipLimit }) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Status[]>(key);
      queryClient.setQueryData(key, (old: Status[] = []) =>
        old.map((s) => (s.id === statusId ? { ...s, wipLimit } : s)),
      );
      return { previous };
    },
    onError(error: ActionErrorResponse, _vars, context) {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      window.toast?.error(formatErrorForToast(error.error));
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return { setWipLimit, isPending };
}
