import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { Person, WorkspaceMember } from "../types";

const MEMBERS_STALE_TIME = 5 * 60 * 1000;

/** Members of the workspace that holds `listId` (assignee picker, board filter). */
export function useListMembers(listId: string | undefined) {
  const { data: members, isPending } = useQuery({
    queryKey: ["members", "list", listId],
    queryFn: () => axiosClient.get<WorkspaceMember[]>(`/api/lists/${listId}/members`),
    enabled: !!listId,
    staleTime: MEMBERS_STALE_TIME,
  });
  return { members, isPending };
}

/** Everyone across my workspaces (Teams page). */
export function usePeople() {
  const { data: people, isPending, error } = useQuery({
    queryKey: ["members", "people"],
    queryFn: () => axiosClient.get<Person[]>("/api/members"),
    staleTime: MEMBERS_STALE_TIME,
  });
  return { people, isPending, error };
}
