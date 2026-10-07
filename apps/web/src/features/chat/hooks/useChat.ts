import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/shared/lib/axios/client";
import { applyPoll, isTemp, newestServerId, prependHistory, upsertMessage } from "../lib";
import type { ChatChannel, ChatChannelSummary, ChatMessage, ChatMessagesPage, ChatState, ChatUser } from "../types";

/** No WebSockets on the free hosting: the open channel polls every few seconds, the sidebar every 30 s. */
const MESSAGES_POLL_MS = 4_000;
const CHANNELS_POLL_MS = 30_000;

export const CHANNELS_KEY = ["chat", "channels"] as const;
const channelKey = (id: string) => ["chat", "channel", id] as const;
const messagesKey = (id: string) => ["chat", "messages", id] as const;
const repliesKey = (id: string) => ["chat", "replies", id] as const;

const messagesUrl = (channelId: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return `/api/chat/channels/${channelId}/messages${query ? `?${query}` : ""}`;
};

/** Channels of all my spaces with unread counts; the sidebar and the palette share it. */
export function useChannels() {
  return useQuery({
    queryKey: CHANNELS_KEY,
    queryFn: () => axiosClient.get<ChatChannelSummary[]>("/api/chat/channels"),
    refetchInterval: CHANNELS_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/** Fresh on every open, so the "New" line reflects the read marker from before this visit. */
export function useChannel(id: string) {
  return useQuery({
    queryKey: channelKey(id),
    queryFn: () => axiosClient.get<ChatChannel>(`/api/chat/channels/${id}`),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; name: string; topic?: string }) =>
      axiosClient.post<ChatChannelSummary>("/api/chat/channels", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY }),
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { name?: string; topic?: string } }) =>
      axiosClient.patch<ChatChannelSummary>(`/api/chat/channels/${id}`, patch),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_KEY });
      queryClient.setQueryData<ChatChannel>(channelKey(channel.id), (c) => c && { ...c, ...channel });
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/api/chat/channels/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHANNELS_KEY }),
  });
}

/** Marks the channel read and clears its badge right away. */
export function useMarkRead(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => axiosClient.post(`/api/chat/channels/${channelId}/read`),
    onMutate: () =>
      queryClient.setQueryData<ChatChannelSummary[]>(CHANNELS_KEY, (channels) =>
        channels?.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c)),
      ),
  });
}

/**
 * The open channel's messages. The latest page loads once; then a poll every 4 s (paused while
 * the tab is hidden) asks for messages after the newest one plus anything changed since the last
 * poll, and merges them into the same cache entry. Older history is prepended on demand.
 */
export function useChannelMessages(channelId: string) {
  const queryClient = useQueryClient();
  const key = messagesKey(channelId);
  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ChatState> => {
      const page = await axiosClient.get<ChatMessagesPage>(messagesUrl(channelId));
      return { messages: page.messages, hasMore: page.hasMore, serverTime: page.serverTime };
    },
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useQuery({
    queryKey: ["chat", "poll", channelId],
    enabled: query.isSuccess,
    queryFn: async () => {
      const state = queryClient.getQueryData<ChatState>(key);
      if (!state) return null;
      const newest = newestServerId(state.messages);
      const page = await axiosClient.get<ChatMessagesPage>(
        messagesUrl(channelId, { since: state.serverTime, ...(newest && { after: newest }) }),
      );
      queryClient.setQueryData<ChatState>(key, (s) => (s ? applyPoll(s, page) : s));
      return page.serverTime;
    },
    refetchInterval: MESSAGES_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    gcTime: 0,
  });

  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadOlder = useCallback(async () => {
    const state = queryClient.getQueryData<ChatState>(key);
    const oldest = state?.messages.find((m) => !isTemp(m.id));
    if (!state?.hasMore || !oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await axiosClient.get<ChatMessagesPage>(messagesUrl(channelId, { before: oldest.id }));
      queryClient.setQueryData<ChatState>(key, (s) => (s ? prependHistory(s, page) : s));
    } finally {
      setLoadingOlder(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, loadingOlder, queryClient]);

  return { ...query, loadOlder, loadingOlder };
}

/** Writes a message returned by the API into the channel (or thread) cache. */
function useStoreMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useCallback(
    (message: ChatMessage, replaceId?: string) => {
      if (message.parentId)
        queryClient.setQueryData<ChatMessage[]>(repliesKey(message.parentId), (replies) =>
          replies?.map((r) => (r.id === message.id ? message : r)),
        );
      else
        queryClient.setQueryData<ChatState>(messagesKey(channelId), (s) =>
          s ? upsertMessage(s, message, replaceId) : s,
        );
    },
    [channelId, queryClient],
  );
}

/** Optimistic send: the message shows at once (greyed) and is swapped for the saved one. */
export function useSendMessage(channelId: string, me: ChatUser | undefined) {
  const queryClient = useQueryClient();
  const store = useStoreMessage(channelId);
  return useMutation({
    mutationFn: ({ body }: { body: string; tempId: string }) =>
      axiosClient.post<ChatMessage>(`/api/chat/channels/${channelId}/messages`, { body }),
    onMutate: ({ body, tempId }) => {
      if (!me) return;
      const now = new Date().toISOString();
      const temp: ChatMessage = {
        id: tempId,
        channelId,
        parentId: null,
        body,
        createdAt: now,
        updatedAt: now,
        editedAt: null,
        author: me,
        reactions: [],
        mentions: [],
        task: null,
        replyCount: 0,
        lastReplyAt: null,
        pending: true,
      };
      queryClient.setQueryData<ChatState>(messagesKey(channelId), (s) => (s ? upsertMessage(s, temp) : s));
    },
    onSuccess: (message, { tempId }) => store(message, tempId),
    onError: (_error, { tempId }) =>
      queryClient.setQueryData<ChatState>(messagesKey(channelId), (s) =>
        s ? { ...s, messages: s.messages.filter((m) => m.id !== tempId) } : s,
      ),
  });
}

export function useEditMessage(channelId: string) {
  const store = useStoreMessage(channelId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      axiosClient.patch<ChatMessage>(`/api/chat/messages/${id}`, { body }),
    onSuccess: (message) => store(message),
  });
}

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: ChatMessage) => axiosClient.delete(`/api/chat/messages/${message.id}`),
    onSuccess: (_r, message) => {
      if (message.parentId) {
        queryClient.setQueryData<ChatMessage[]>(repliesKey(message.parentId), (replies) =>
          replies?.filter((r) => r.id !== message.id),
        );
        queryClient.setQueryData<ChatState>(messagesKey(channelId), (s) =>
          s
            ? { ...s, messages: s.messages.map((m) => (m.id === message.parentId ? { ...m, replyCount: Math.max(0, m.replyCount - 1) } : m)) }
            : s,
        );
      } else
        queryClient.setQueryData<ChatState>(messagesKey(channelId), (s) =>
          s ? { ...s, messages: s.messages.filter((m) => m.id !== message.id) } : s,
        );
    },
  });
}

export function useToggleReaction(channelId: string) {
  const store = useStoreMessage(channelId);
  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      axiosClient.post<ChatMessage>(`/api/chat/messages/${id}/reactions`, { emoji }),
    onSuccess: (message) => store(message),
  });
}

export function useTurnIntoTask(channelId: string) {
  const queryClient = useQueryClient();
  const store = useStoreMessage(channelId);
  return useMutation({
    mutationFn: ({ id, listId }: { id: string; listId: string }) =>
      axiosClient.post<{ task: { id: string; name: string; listId: string }; message: ChatMessage }>(
        `/api/chat/messages/${id}/task`,
        { listId },
      ),
    onSuccess: ({ task, message }) => {
      store(message);
      queryClient.invalidateQueries({ queryKey: ["tasks", task.listId] });
    },
  });
}

/** Thread replies, polled while the thread panel is open. */
export function useReplies(parentId: string) {
  return useQuery({
    queryKey: repliesKey(parentId),
    queryFn: () => axiosClient.get<ChatMessage[]>(`/api/chat/messages/${parentId}/replies`),
    refetchInterval: MESSAGES_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useSendReply(channelId: string, parentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      axiosClient.post<ChatMessage>(`/api/chat/channels/${channelId}/messages`, { body, parentId }),
    onSuccess: (reply) => {
      queryClient.setQueryData<ChatMessage[]>(repliesKey(parentId), (replies) =>
        replies && !replies.some((r) => r.id === reply.id) ? [...replies, reply] : replies,
      );
      queryClient.setQueryData<ChatState>(messagesKey(channelId), (s) =>
        s
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === parentId ? { ...m, replyCount: m.replyCount + 1, lastReplyAt: reply.createdAt } : m,
              ),
            }
          : s,
      );
    },
  });
}

/** Lists of every space I belong to (the "Turn into task" picker filters them by the channel's space). */
export function useMyLists() {
  return useQuery({
    queryKey: ["chat", "lists"],
    queryFn: () => axiosClient.get<{ id: string; name: string; workspaceId: string }[]>("/api/lists"),
    staleTime: 60_000,
  });
}
