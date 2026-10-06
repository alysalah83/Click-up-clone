import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { SprintReport, SprintSummary } from "./types";

/**
 * Keys live under ["tasks", listId], so every task mutation that invalidates the list's tasks
 * also refreshes the sprint header and report.
 */
export const sprintKey = (listId: string) => ["tasks", listId, "sprint"] as const;
export const sprintReportKey = (listId: string) => ["tasks", listId, "sprint-report"] as const;

export function useSprintSummary(listId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: sprintKey(listId ?? ""),
    queryFn: () => axiosClient.get<SprintSummary>(`/api/sprints/${listId}`),
    enabled: !!listId && enabled,
    staleTime: 15_000,
  });
}

export function useSprintReport(listId: string) {
  return useQuery({
    queryKey: sprintReportKey(listId),
    queryFn: () => axiosClient.get<SprintReport>(`/api/sprints/${listId}/report`),
    staleTime: 15_000,
  });
}
