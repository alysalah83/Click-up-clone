import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import type { Whiteboard, WhiteboardPatch, WhiteboardSummary } from "../types";

export const WHITEBOARDS_KEY = ["whiteboards", "list"] as const;
const boardKey = (id: string) => ["whiteboards", "detail", id] as const;

/** Every board in my spaces (no scene). The sidebar and the index page share this one query. */
export function useWhiteboards() {
  return useQuery({
    queryKey: WHITEBOARDS_KEY,
    queryFn: () => axiosClient.get<WhiteboardSummary[]>("/api/whiteboards"),
    staleTime: 30_000,
  });
}

export function useWhiteboard(id: string) {
  return useQuery({
    queryKey: boardKey(id),
    queryFn: () => axiosClient.get<Whiteboard>(`/api/whiteboards/${id}`),
    retry: false,
    // The canvas owns the scene once mounted; refetches must not replace what is being drawn.
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useCreateWhiteboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; title?: string }) =>
      axiosClient.post<Whiteboard>("/api/whiteboards", input),
    onSuccess: (board) => {
      queryClient.setQueryData(boardKey(board.id), board);
      queryClient.invalidateQueries({ queryKey: WHITEBOARDS_KEY });
    },
  });
}

export function useUpdateWhiteboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: WhiteboardPatch }) =>
      axiosClient.patch<WhiteboardSummary>(`/api/whiteboards/${id}`, patch),
    onSuccess: (board) => {
      queryClient.setQueryData<WhiteboardSummary[]>(WHITEBOARDS_KEY, (boards) =>
        boards?.map((b) => (b.id === board.id ? { ...b, title: board.title, updatedAt: board.updatedAt } : b)),
      );
    },
  });
}

export function useDeleteWhiteboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/whiteboards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["whiteboards"] }),
  });
}

/** Lists of every space I belong to; the note-to-task picker filters them by the board's space. */
export function useMyLists() {
  return useQuery({
    queryKey: ["whiteboards", "lists"],
    queryFn: () => axiosClient.get<{ id: string; name: string; workspaceId: string }[]>("/api/lists"),
    staleTime: 60_000,
  });
}

export function useCreateTaskFromNote(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { listId: string; name: string }) =>
      axiosClient.post<{ id: string; listId: string; name: string }>(`/api/whiteboards/${boardId}/tasks`, input),
    onSuccess: (task) => queryClient.invalidateQueries({ queryKey: ["tasks", task.listId] }),
  });
}
