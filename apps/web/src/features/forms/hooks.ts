import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosClient } from "@/shared/lib/axios/client";
import type { Form, FormDraft } from "./types";

export const formsKey = (listId: string) => ["forms", listId] as const;

/** The list's forms (oldest first). */
export function useListForms(listId: string | undefined) {
  return useQuery({
    queryKey: formsKey(listId ?? ""),
    queryFn: () => axiosClient.get<Form[]>(`/api/lists/${listId}/forms`),
    enabled: !!listId,
    staleTime: 30 * 1000,
  });
}

export function useCreateForm(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => axiosClient.post<Form>(`/api/lists/${listId}/forms`, title ? { title } : {}),
    onSuccess: (form) =>
      queryClient.setQueryData<Form[]>(formsKey(listId), (list) => [...(list ?? []), form]),
    onError: () => toast.error("Could not create the form"),
  });
}

/** Autosave: the builder keeps its own draft, so the response only refreshes the cached copy. */
export function useUpdateForm(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FormDraft> }) =>
      axiosClient.patch<Form>(`/api/forms/${id}`, patch),
    onSuccess: (form) =>
      queryClient.setQueryData<Form[]>(formsKey(listId), (list) => list?.map((f) => (f.id === form.id ? form : f))),
    onError: (error: Error) => toast.error(error.message || "Could not save the form"),
  });
}

export function useDeleteForm(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/forms/${id}`),
    onSuccess: (_data, id) =>
      queryClient.setQueryData<Form[]>(formsKey(listId), (list) => list?.filter((f) => f.id !== id)),
    onError: () => toast.error("Could not delete the form"),
  });
}
