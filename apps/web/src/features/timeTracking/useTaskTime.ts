import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { TaskTime } from "./types";

const timeKey = (taskId: string) => ["time", taskId] as const;

export function useTaskTime(taskId: string) {
  const { data, isPending } = useQuery({
    queryKey: timeKey(taskId),
    queryFn: () => axiosClient.get<TaskTime>(`/api/time-entries?taskId=${taskId}`),
    staleTime: 15 * 1000,
  });
  return { time: data, isPending };
}

/** Start/stop/add/delete. Every write refetches the time of the task and its activity feed. */
export function useTimeMutations(taskId: string) {
  const queryClient = useQueryClient();
  const settle = () => {
    queryClient.invalidateQueries({ queryKey: ["time"] });
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
  };
  const onError = (error: unknown) =>
    window.toast?.error(error instanceof Error ? error.message : "Could not update the time", 7);

  const start = useMutation({
    mutationFn: () => axiosClient.post("/api/time-entries/start", { taskId }),
    onError,
    onSettled: settle,
  });
  const stop = useMutation({
    mutationFn: (entryId: string) => axiosClient.post(`/api/time-entries/${entryId}/stop`),
    onError,
    onSettled: settle,
  });
  const addManual = useMutation({
    mutationFn: (durationSec: number) => axiosClient.post("/api/time-entries/manual", { taskId, durationSec }),
    onError,
    onSettled: settle,
  });
  const remove = useMutation({
    mutationFn: (entryId: string) => axiosClient.delete(`/api/time-entries/${entryId}`),
    onError,
    onSettled: settle,
  });
  return {
    start: start.mutate,
    stop: stop.mutate,
    addManual: addManual.mutate,
    remove: remove.mutate,
    busy: start.isPending || stop.isPending || addManual.isPending,
  };
}
