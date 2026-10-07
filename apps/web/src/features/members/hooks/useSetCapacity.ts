import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { WorkspaceMember } from "../types";

type Capacity = Partial<Pick<WorkspaceMember, "capacityTasks" | "capacityPoints">>;

/** Sets a member's Workload capacity, updating the list's members cache optimistically. */
export function useSetCapacity(listId: string | undefined, workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const key = ["members", "list", listId];

  const { mutate: setCapacity } = useMutation({
    mutationFn: ({ userId, ...capacity }: Capacity & { userId: string }) =>
      axiosClient.patch(`/api/workspaces/${workspaceId}/members/${userId}/capacity`, capacity),
    async onMutate({ userId, ...capacity }) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkspaceMember[]>(key);
      queryClient.setQueryData<WorkspaceMember[]>(key, (members = []) =>
        members.map((m) => (m.userId === userId ? { ...m, ...capacity } : m)),
      );
      return { previous };
    },
    onError(error: Error, _vars, context) {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      window.toast?.error(error.message || "Could not save the capacity", 7);
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return { setCapacity };
}
