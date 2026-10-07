import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosClient } from "@/shared/lib/axios/client";
import type { Task } from "@/features/task/types";
import type { CustomField, CustomFieldDraft, CustomFieldValue } from "./types";

export const customFieldsKey = (listId: string) => ["custom-fields", listId] as const;

/** The list's custom fields, in column order. */
export function useCustomFields(listId: string | undefined) {
  const { data: fields, isPending } = useQuery({
    queryKey: customFieldsKey(listId ?? ""),
    queryFn: () => axiosClient.get<CustomField[]>(`/api/lists/${listId}/custom-fields`),
    enabled: !!listId,
    staleTime: 60 * 1000,
  });
  return { fields, isPending };
}

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message) || fallback;

export function useCreateCustomField(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: CustomFieldDraft) => axiosClient.post<CustomField>(`/api/lists/${listId}/custom-fields`, draft),
    onSuccess: (field) =>
      queryClient.setQueryData<CustomField[]>(customFieldsKey(listId), (list) => [...(list ?? []), field]),
    onError: (error) => toast.error(errorMessage(error, "Could not add the field")),
  });
}

export function useUpdateCustomField(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<CustomFieldDraft, "type">> }) =>
      axiosClient.patch<CustomField>(`/api/custom-fields/${id}`, patch),
    onSuccess: () => {
      // A rename can rewrite formulas, and removed options clear values: refetch both.
      queryClient.invalidateQueries({ queryKey: customFieldsKey(listId) });
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not save the field")),
  });
}

export function useDeleteCustomField(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/custom-fields/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<CustomField[]>(customFieldsKey(listId), (list) => list?.filter((f) => f.id !== id));
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
    },
    onError: (error) => toast.error(errorMessage(error, "Could not delete the field")),
  });
}

function withValue<T extends Pick<Task, "id" | "customFields">>(task: T, taskId: string, fieldId: string, value: CustomFieldValue | null): T {
  if (task.id !== taskId) return task;
  const customFields = { ...task.customFields };
  if (value === null) delete customFields[fieldId];
  else customFields[fieldId] = value;
  return { ...task, customFields };
}

/** Writes a value into every cached copy of the task (list views and the task page). */
function patchCaches(queryClient: QueryClient, listId: string, taskId: string, fieldId: string, value: CustomFieldValue | null) {
  queryClient.setQueriesData<unknown>({ queryKey: ["tasks", listId] }, (old: unknown) =>
    Array.isArray(old) ? (old as Task[]).map((t) => withValue(t, taskId, fieldId, value)) : old,
  );
  queryClient.setQueryData<Task>(["task", taskId], (old) => (old ? withValue(old, taskId, fieldId, value) : old));
}

/** Sets (or with `null`, clears) a task's value, optimistically. */
export function useSetCustomFieldValue(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, fieldId, value }: { taskId: string; fieldId: string; value: CustomFieldValue | null }) =>
      axiosClient.put(`/api/tasks/${taskId}/custom-fields/${fieldId}`, { value }),
    onMutate: async ({ taskId, fieldId, value }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", listId] });
      patchCaches(queryClient, listId, taskId, fieldId, value);
    },
    onError: (error) => toast.error(errorMessage(error, "Could not save the value")),
    onSettled: (_data, _error, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", listId] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
}
