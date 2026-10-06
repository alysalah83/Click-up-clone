import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { axiosClient } from "@/shared/lib/axios/client";
import type { Goal, GoalInput, NewTargetInput, TaskGoalChip, TaskSearchHit } from "./types";

export const GOALS_KEY = ["goals", "list"] as const;
const goalKey = (id: string) => ["goals", "detail", id] as const;

/**
 * Goal progress is computed live from task statuses on the server, so goal queries are
 * always stale: opening the page after completing a task shows the new progress.
 */
export function useGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: () => axiosClient.get<Goal[]>("/api/goals"),
    staleTime: 0,
  });
}

export function useGoal(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: goalKey(id),
    queryFn: () => axiosClient.get<Goal>(`/api/goals/${id}`),
    staleTime: 0,
    retry: false,
    placeholderData: () => queryClient.getQueryData<Goal[]>(GOALS_KEY)?.find((g) => g.id === id),
  });
}

/** The goals a task counts toward (task panel); refetched when the task's status changes. */
export function useTaskGoals(taskId: string, statusId: string) {
  return useQuery({
    queryKey: ["goals", "task", taskId, statusId],
    queryFn: () => axiosClient.get<TaskGoalChip[]>(`/api/tasks/${taskId}/goals`),
    staleTime: 0,
  });
}

/** Every goal mutation answers with the whole recomputed goal: write it into both caches. */
function useGoalMutation<V>(mutationFn: (vars: V) => Promise<Goal>, errorMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (goal) => {
      queryClient.setQueryData(goalKey(goal.id), goal);
      queryClient.setQueryData<Goal[]>(GOALS_KEY, (goals) => goals?.map((g) => (g.id === goal.id ? goal : g)));
      queryClient.invalidateQueries({ queryKey: ["goals", "task"] });
    },
    onError: () => toast.error(errorMessage),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput & { workspaceId: string; name: string }) =>
      axiosClient.post<Goal>("/api/goals", input),
    onSuccess: (goal) => {
      queryClient.setQueryData(goalKey(goal.id), goal);
      queryClient.setQueryData<Goal[]>(GOALS_KEY, (goals) => (goals ? [...goals, goal] : goals));
    },
    onError: () => toast.error("Could not create the goal"),
  });
}

export function useUpdateGoal(id: string) {
  return useGoalMutation(
    (patch: GoalInput) => axiosClient.patch<Goal>(`/api/goals/${id}`, patch),
    "Could not save the goal",
  );
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/goals/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Goal[]>(GOALS_KEY, (goals) => goals?.filter((g) => g.id !== id));
      queryClient.removeQueries({ queryKey: goalKey(id) });
      queryClient.invalidateQueries({ queryKey: ["goals", "task"] });
    },
    onError: () => toast.error("Could not delete the goal"),
  });
}

export function useAddTarget(goalId: string) {
  return useGoalMutation(
    (input: NewTargetInput) => axiosClient.post<Goal>(`/api/goals/${goalId}/targets`, input),
    "Could not add the target",
  );
}

export function useUpdateTarget(goalId: string) {
  return useGoalMutation(
    ({ targetId, ...patch }: { targetId: string; name?: string; currentValue?: number; targetValue?: number }) =>
      axiosClient.patch<Goal>(`/api/goals/${goalId}/targets/${targetId}`, patch),
    "Could not update the target",
  );
}

export function useDeleteTarget(goalId: string) {
  return useGoalMutation(
    (targetId: string) => axiosClient.delete<Goal>(`/api/goals/${goalId}/targets/${targetId}`),
    "Could not delete the target",
  );
}

export function useLinkTasks(goalId: string) {
  return useGoalMutation(
    ({ targetId, taskIds }: { targetId: string; taskIds: string[] }) =>
      axiosClient.post<Goal>(`/api/goals/${goalId}/targets/${targetId}/tasks`, { taskIds }),
    "Could not link the task",
  );
}

export function useUnlinkTask(goalId: string) {
  return useGoalMutation(
    ({ targetId, taskId }: { targetId: string; taskId: string }) =>
      axiosClient.delete<Goal>(`/api/goals/${goalId}/targets/${targetId}/tasks/${taskId}`),
    "Could not unlink the task",
  );
}

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Task search (the Ctrl+K endpoint) narrowed to one space, debounced. */
export function useTaskSearch(workspaceId: string, query: string) {
  const q = useDebounced(query.trim(), 250);
  const result = useQuery({
    queryKey: ["search", "tasks", workspaceId, q],
    queryFn: () =>
      axiosClient
        .get<{ tasks: TaskSearchHit[] }>(`/api/search?q=${encodeURIComponent(q)}&workspaceId=${workspaceId}`)
        .then((r) => r.tasks),
    enabled: q.length > 0,
    staleTime: 10_000,
  });
  return { ...result, q };
}
