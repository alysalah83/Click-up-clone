import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";

export type Notification = {
  id: string;
  type: "ASSIGNED" | "MENTIONED" | "TASK_UPDATED" | "COMMENTED";
  message: string;
  taskId: string;
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string | null; avatarColor: string | null };
  task: { id: string; name: string; listId: string };
};

const POLL_MS = 30_000;

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => axiosClient.get<{ count: number }>("/api/notifications/unread-count"),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => axiosClient.get<Notification[]>("/api/notifications"),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

export function useMarkRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => axiosClient.post(`/api/notifications/${id}/read`),
    onSettled: invalidate,
  });
}

export function useMarkAllRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: () => axiosClient.post("/api/notifications/read-all"),
    onSettled: invalidate,
  });
}
