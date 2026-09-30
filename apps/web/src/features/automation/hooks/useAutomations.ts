import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";

export type Priority = "urgent" | "high" | "normal" | "low" | "none";
export type AutomationTrigger =
  | { type: "status_changed"; to: string }
  | { type: "task_created" };
export type AutomationAction =
  | { type: "notify_assignees" }
  | { type: "assign_user"; userId: string }
  | { type: "set_priority"; priority: Priority }
  | { type: "set_status"; statusId: string };
export type CreateAutomationInput = {
  name: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
};

export type Automation = CreateAutomationInput & {
  id: string;
  listId: string;
  enabled: boolean;
  createdAt: string;
};

export function useAutomations(listId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["automations", listId],
    queryFn: () => axiosClient.get<Automation[]>(`/api/lists/${listId}/automations`),
    enabled: !!listId && enabled,
  });
}

/** Failed mutations show a toast. */
export function useAutomationMutations(listId: string) {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: ["automations", listId] });
  const onError = (error: Error) => window.toast?.error(error.message, 7);
  return {
    create: useMutation({
      mutationFn: (input: CreateAutomationInput) =>
        axiosClient.post<Automation>(`/api/lists/${listId}/automations`, input),
      onSettled,
      onError,
    }),
    toggle: useMutation({
      mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
        axiosClient.patch<Automation>(`/api/automations/${id}`, { enabled }),
      onSettled,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => axiosClient.delete(`/api/automations/${id}`),
      onSettled,
      onError,
    }),
  };
}
