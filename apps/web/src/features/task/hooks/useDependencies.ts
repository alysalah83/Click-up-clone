import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";

/** `taskId` is blocked by `dependsOnId` (mirrors `TaskDependencyDto` in @clickup/shared). */
export type TaskDependencyDto = { taskId: string; dependsOnId: string };

const depsKey = (listId: string) => ["dependencies", listId] as const;

/** "Blocked by" links between the tasks of a list (`taskId` is blocked by `dependsOnId`). */
export function useDependencies(listId: string | undefined) {
  const { data, isPending } = useQuery({
    queryKey: depsKey(listId ?? ""),
    queryFn: () =>
      axiosClient.get<TaskDependencyDto[]>(`/api/dependencies?listId=${listId}`),
    enabled: !!listId,
    staleTime: 30 * 1000,
  });
  return { dependencies: data ?? [], isPending };
}

export function useDependencyMutations(listId: string) {
  const queryClient = useQueryClient();
  const key = depsKey(listId);
  const settle = () => queryClient.invalidateQueries({ queryKey: key });
  const onError = (error: unknown) =>
    window.toast?.error(
      error instanceof Error ? error.message : "Could not update the link",
      7,
    );

  const add = useMutation({
    mutationFn: (dep: TaskDependencyDto) =>
      axiosClient.post("/api/dependencies", dep),
    async onMutate(dep) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TaskDependencyDto[]>(key);
      queryClient.setQueryData<TaskDependencyDto[]>(key, (old = []) => [
        ...old,
        dep,
      ]);
      return { previous };
    },
    onError(error, _dep, context) {
      queryClient.setQueryData(key, context?.previous);
      onError(error);
    },
    onSettled: settle,
  });

  const remove = useMutation({
    mutationFn: ({ taskId, dependsOnId }: TaskDependencyDto) =>
      axiosClient.delete(`/api/dependencies/${taskId}/${dependsOnId}`),
    async onMutate(dep) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TaskDependencyDto[]>(key);
      queryClient.setQueryData<TaskDependencyDto[]>(key, (old = []) =>
        old.filter(
          (d) => !(d.taskId === dep.taskId && d.dependsOnId === dep.dependsOnId),
        ),
      );
      return { previous };
    },
    onError(error, _dep, context) {
      queryClient.setQueryData(key, context?.previous);
      onError(error);
    },
    onSettled: settle,
  });

  return { addDependency: add.mutate, removeDependency: remove.mutate };
}
