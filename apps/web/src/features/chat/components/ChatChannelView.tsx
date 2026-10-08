"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, Hash, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import MiniSpinner from "@/shared/ui/MiniSpinner";
import {
  useChannel,
  useChannelMessages,
  useDeleteChannel,
  useMarkRead,
  useSendMessage,
  useUpdateChannel,
} from "../hooks/useChat";
import { buildRows, newestServerId, type MessageRow } from "../lib";
import type { ChatChannel, ChatMessage } from "../types";
import ChatComposer from "./ChatComposer";
import MessageItem from "./MessageItem";
import ThreadPanel from "./ThreadPanel";

/** Pixels from the bottom that still count as "at the bottom" (scroll stays pinned). */
const PIN_SLACK = 80;

function MemberStack({ channel }: { channel: ChatChannel }) {
  const shown = channel.members.slice(0, 4);
  const extra = channel.members.length - shown.length;
  return (
    <div
      className="flex items-center -space-x-1.5"
      title={channel.members.map((m) => displayName(m)).join(", ")}
      aria-label={`${channel.members.length} members`}
    >
      {shown.map((m) => (
        <UserAvatar key={m.id} user={m} size="sm" />
      ))}
      {extra > 0 && (
        <span className="z-10 inline-flex size-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700 ring-2 ring-white dark:bg-neutral-700 dark:text-neutral-200 dark:ring-neutral-950">
          +{extra}
        </span>
      )}
    </div>
  );
}

function ChannelHeader({ channel }: { channel: ChatChannel }) {
  const router = useRouter();
  const update = useUpdateChannel();
  const remove = useDeleteChannel();
  const [editingTopic, setEditingTopic] = useState(false);

  const saveTopic = (value: string) => {
    setEditingTopic(false);
    if (value.trim() === channel.topic) return;
    update.mutate({ id: channel.id, patch: { topic: value.trim() } }, { onError: () => toast.error("Could not save the topic") });
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete #${channel.name} and all its messages?`)) return;
    try {
      await remove.mutateAsync(channel.id);
      router.push("/home/chat");
    } catch {
      toast.error("Could not delete the channel");
    }
  };

  return (
    <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-2.5 sm:px-6 dark:border-neutral-800">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
        <Hash className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="truncate text-base font-semibold">{channel.name}</h1>
          <span className="hidden truncate text-xs text-neutral-500 sm:inline">{channel.workspaceName}</span>
        </div>
        {editingTopic ? (
          <input
            autoFocus
            defaultValue={channel.topic}
            maxLength={250}
            aria-label="Channel topic"
            placeholder="What is this channel about?"
            onBlur={(e) => saveTopic(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditingTopic(false);
            }}
            className="w-full max-w-lg rounded border border-violet-400 bg-transparent px-1 text-xs outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTopic(true)}
            className="block max-w-full cursor-text truncate text-left text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            {channel.topic || "Add a topic"}
          </button>
        )}
      </div>
      <MemberStack channel={channel} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Channel options"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditingTopic(true)}>Edit topic</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            Delete channel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-5 px-6 py-6" aria-busy="true">
      {[0.6, 0.85, 0.45, 0.7].map((w, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5" style={{ width: `${w * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChannelBody({ channel }: { channel: ChatChannel }) {
  const { data, isPending, error, loadOlder, loadingOlder } = useChannelMessages(channel.id);
  const me = channel.members.find((m) => m.id === channel.viewerId);
  const send = useSendMessage(channel.id, me);
  const markRead = useMarkRead(channel.id);
  const searchParams = useSearchParams();
  const focusId = searchParams.get("message");

  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const [showPill, setShowPill] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  // A message opened from the Inbox flashes for a moment.
  const [highlightId, setHighlightId] = useState<string | null>(focusId);
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightId]);
  // The read marker from before this visit: the "New" line stays put while reading.
  const [lastReadAt] = useState(channel.lastReadAt);

  const messages = useMemo(() => data?.messages ?? [], [data]);
  const rows = useMemo(
    () => buildRows(messages, { lastReadAt, viewerId: channel.viewerId }),
    [messages, lastReadAt, channel.viewerId],
  );
  const dayGroups = useMemo(() => {
    const groups: { key: string; label: string | null; rows: MessageRow[] }[] = [];
    for (const row of rows) {
      if (row.type === "day") groups.push({ key: row.key, label: row.label, rows: [] });
      else {
        if (groups.length === 0) groups.push({ key: "day-start", label: null, rows: [] });
        groups.at(-1)!.rows.push(row);
      }
    }
    return groups;
  }, [rows]);
  const newest = newestServerId(messages);
  const last = messages.at(-1);
  const oldestId = messages[0]?.id;
  const thread = threadId ? messages.find((m) => m.id === threadId) : undefined;

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    atBottom.current = true;
    setShowPill(false);
  }, []);

  // First paint: jump to the linked message, else to the "New" line, else to the bottom.
  const initialized = useRef(false);
  useLayoutEffect(() => {
    if (initialized.current || !data) return;
    initialized.current = true;
    const target =
      (focusId && document.getElementById(`chat-msg-${focusId}`)) || document.getElementById("chat-new-line");
    const el = scrollRef.current;
    if (target && el) {
      // Scroll only the list (scrollIntoView would also scroll the app shell).
      const offset = target.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
      el.scrollTop = focusId ? offset - (el.clientHeight - target.offsetHeight) / 2 : offset - 40;
      atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_SLACK;
    } else scrollToBottom();
  }, [data, focusId, scrollToBottom]);

  // New messages: stay pinned when at the bottom (or when I sent it), else offer the pill.
  const lastKey = last ? `${last.id}` : "";
  const prevLastKey = useRef(lastKey);
  useLayoutEffect(() => {
    if (!initialized.current || prevLastKey.current === lastKey) return;
    prevLastKey.current = lastKey;
    if (atBottom.current || last?.author.id === channel.viewerId) scrollToBottom();
    else setShowPill(true);
  }, [lastKey, last, channel.viewerId, scrollToBottom]);

  // Older history was prepended: keep the reader where they were.
  const prevHeight = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && prevHeight.current !== null) {
      el.scrollTop += el.scrollHeight - prevHeight.current;
      prevHeight.current = null;
    }
  }, [oldestId]);

  const fetchOlder = useCallback(() => {
    if (!data?.hasMore || loadingOlder) return;
    prevHeight.current = scrollRef.current?.scrollHeight ?? null;
    void loadOlder();
  }, [data?.hasMore, loadingOlder, loadOlder]);

  // Read up to the newest message while it is on screen.
  const markedRef = useRef<string | undefined>(undefined);
  const { mutate: markReadNow } = markRead;
  const maybeMarkRead = useCallback(() => {
    if (!newest || markedRef.current === newest) return;
    if (!atBottom.current || document.visibilityState !== "visible") return;
    markedRef.current = newest;
    markReadNow();
  }, [newest, markReadNow]);
  useEffect(() => {
    maybeMarkRead();
    document.addEventListener("visibilitychange", maybeMarkRead);
    return () => document.removeEventListener("visibilitychange", maybeMarkRead);
  }, [maybeMarkRead]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_SLACK;
    if (atBottom.current) {
      setShowPill(false);
      maybeMarkRead();
    }
    if (el.scrollTop < 60) fetchOlder();
  };

  const openThread = useCallback((m: ChatMessage) => setThreadId(m.id), []);

  const submit = (body: string) =>
    send.mutate(
      { body, tempId: `temp-${Date.now()}` },
      { onError: () => toast.error("Message not sent. Check your connection and try again.") },
    );

  return (
    <div className="relative flex min-h-0 flex-1">
      <section className="relative flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} onScroll={onScroll} className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2">
          {isPending && <MessagesSkeleton />}
          {error && <p className="p-6 text-sm text-destructive">Could not load messages.</p>}
          {data && (
            <>
              <div className="mt-auto" />
              {data.hasMore ? (
                <div className="flex justify-center py-3">
                  <button
                    type="button"
                    onClick={fetchOlder}
                    disabled={loadingOlder}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {loadingOlder && <MiniSpinner bgColor="bg-neutral-500" width="small" padding="p-0.5" />}
                    Load older messages
                  </button>
                </div>
              ) : (
                <div className="px-4 pt-8 pb-4 sm:px-6">
                  <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                    <Hash className="size-6" aria-hidden />
                  </div>
                  <h2 className="text-lg font-semibold">Welcome to #{channel.name}</h2>
                  <p className="text-sm text-neutral-500">
                    This is the start of the channel{channel.topic ? `: ${channel.topic}` : "."}
                  </p>
                </div>
              )}
              {dayGroups.map((group) => (
                // One section per day so its sticky pill only sticks while that day is on screen.
                <div key={group.key} className="relative">
                  {group.label && (
                    <>
                      <span
                        aria-hidden
                        className="absolute inset-x-4 top-[19px] h-px bg-neutral-200 sm:inset-x-6 dark:bg-neutral-800"
                      />
                      <div role="separator" aria-label={group.label} className="pointer-events-none sticky top-0 z-[5] my-2 flex justify-center">
                        <span className="dark:bg-neutral-925 rounded-full border border-neutral-200 bg-white px-3 py-0.5 text-[11px] font-semibold text-neutral-600 shadow-sm dark:border-neutral-700 dark:text-neutral-300">
                          {group.label}
                        </span>
                      </div>
                    </>
                  )}
                  {group.rows.map((row) =>
                row.type === "day" ? null : row.type === "new" ? (
                  <div key={row.key} id="chat-new-line" className="my-1 flex items-center gap-2 px-4 sm:px-6" role="separator">
                    <span className="h-px flex-1 bg-rose-400/70" />
                    <span className="text-[11px] font-bold tracking-wide text-rose-500 uppercase">New</span>
                  </div>
                ) : (
                  <MessageItem
                    key={row.key}
                    message={row.message}
                    showHeader={row.showHeader}
                    viewerId={channel.viewerId}
                    members={channel.members}
                    workspaceId={channel.workspaceId}
                    onOpenThread={openThread}
                    highlighted={highlightId === row.message.id}
                  />
                ),
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {showPill && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-28 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-violet-500"
          >
            <ArrowDown className="size-3.5" aria-hidden />
            New messages
          </button>
        )}

        <div className="px-4 pt-1 pb-3 sm:px-6">
          <ChatComposer members={channel.members} placeholder={`Message #${channel.name}`} onSubmit={submit} autoFocus />
        </div>
      </section>
      {thread && <ThreadPanel key={thread.id} channel={channel} parent={thread} onClose={() => setThreadId(null)} />}
    </div>
  );
}

/** A channel in the ClickUp chat look: header, grouped message list, composer and threads. */
function ChatChannelView({ channelId }: { channelId: string }) {
  const { data: channel, isPending, error } = useChannel(channelId);

  if (error)
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
        <h1 className="text-lg font-semibold">Channel not found</h1>
        <p className="text-sm text-muted-foreground">It may have been deleted, or it belongs to a space you left.</p>
        <Link href="/home/chat" className="text-sm text-violet-600 hover:underline">
          All channels
        </Link>
      </div>
    );

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-[480px] flex-col">
      {isPending || !channel ? (
        <>
          <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-40" />
          </div>
          <MessagesSkeleton />
        </>
      ) : (
        <>
          <ChannelHeader channel={channel} />
          <ChannelBody channel={channel} />
        </>
      )}
    </div>
  );
}

export default ChatChannelView;
