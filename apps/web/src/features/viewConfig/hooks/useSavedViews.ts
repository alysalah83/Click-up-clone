import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { ViewConfig, SavedView } from "../types";

const key = (listId: string | undefined) => ["saved-views", listId] as const;

export function useSavedViews(listId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key(listId) });

  const { data: views, isPending } = useQuery({
    queryKey: key(listId),
    queryFn: () => axiosClient.get<SavedView[]>(`/api/saved-views/list/${listId}`),
    enabled: !!listId,
    staleTime: 5 * 60 * 1000,
  });

  const create = useMutation({
    mutationFn: (input: { name: string; config: ViewConfig; isDefault?: boolean }) =>
      axiosClient.post<SavedView>("/api/saved-views", { listId, ...input }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, ...patch }: { id: string; name?: string; config?: ViewConfig; isDefault?: boolean }) =>
      axiosClient.patch<SavedView>(`/api/saved-views/${id}`, patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/saved-views/${id}`),
    onSuccess: invalidate,
  });

  return { views, isPending, create, update, remove };
}
