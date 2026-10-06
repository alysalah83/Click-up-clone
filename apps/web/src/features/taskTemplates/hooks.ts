import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosClient } from "@/shared/lib/axios/client";
import { formatErrorForToast } from "@/shared/lib/utils/formatErrorForToast";
import type { ActionErrorResponse } from "@/shared/types/action.types";
import { useOpenTask } from "@/features/taskDetail/hooks/useTaskParam";
import { applyTemplateAction } from "./actions";
import type { TaskTemplate, TemplateTarget } from "./types";

export const TEMPLATES_KEY = ["task-templates"] as const;

/** Templates of every space I belong to (they can be used in any list). */
export function useTaskTemplates(enabled = true) {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: () => axiosClient.get<TaskTemplate[]>("/api/task-templates"),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useSaveAsTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { taskId: string; name: string; description: string }) =>
      axiosClient.post<TaskTemplate>("/api/task-templates/from-task", input),
    onSuccess: (template) => {
      queryClient.setQueryData<TaskTemplate[]>(TEMPLATES_KEY, (list) => (list ? [...list, template] : list));
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success(`Saved template "${template.name}"`);
    },
    onError: () => toast.error("Could not save the template"),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; name?: string; description?: string }) =>
      axiosClient.patch<TaskTemplate>(`/api/task-templates/${id}`, patch),
    onSuccess: (template) =>
      queryClient.setQueryData<TaskTemplate[]>(TEMPLATES_KEY, (list) =>
        list?.map((t) => (t.id === template.id ? template : t)),
      ),
    onError: () => toast.error("Could not rename the template"),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/task-templates/${id}`),
    onSuccess: (_data, id) =>
      queryClient.setQueryData<TaskTemplate[]>(TEMPLATES_KEY, (list) => list?.filter((t) => t.id !== id)),
    onError: () => toast.error("Could not delete the template"),
  });
}

/** Creates the task server-side (task, subtasks, checklists, tags), then opens its panel. */
export function useApplyTemplate() {
  const queryClient = useQueryClient();
  const openTask = useOpenTask();
  return useMutation({
    mutationFn: async ({ templateId, target, name }: { templateId: string; target: TemplateTarget; name?: string }) => {
      const response = await applyTemplateAction(templateId, { ...target, name });
      if (response.status === "error") throw response;
      if (response.status !== "success" || !("payload" in response)) throw new Error("No task returned");
      return response.payload.newTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.listId] });
      window.toast?.success(`Task (${task.name}) has been added`);
      openTask(task.id);
    },
    onError: (error: ActionErrorResponse | Error) =>
      window.toast?.error("error" in error ? formatErrorForToast(error.error) : "Could not use the template", 7),
  });
}
