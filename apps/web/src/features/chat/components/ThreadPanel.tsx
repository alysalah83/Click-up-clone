"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useReplies, useSendReply } from "../hooks/useChat";
import type { ChatChannel, ChatMessage } from "../types";
import ChatComposer from "./ChatComposer";
import MessageItem from "./MessageItem";

interface ThreadPanelProps {
  channel: ChatChannel;
  parent: ChatMessage;
  onClose: () => void;
}

/** Replies of one message, beside the channel (polled while open). */
function ThreadPanel({ channel, parent, onClose }: ThreadPanelProps) {
  const { data: replies, isPending } = useReplies(parent.id);
  const send = useSendReply(channel.id, parent.id);
  const listRef = useRef<HTMLDivElement>(null);
  const count = replies?.length ?? 0;

  useEffect(() => {
    // Scroll only the reply list (scrollIntoView would also scroll the app shell).
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  const common = { viewerId: channel.viewerId, members: channel.members, workspaceId: channel.workspaceId };

  return (
    <aside
      aria-label="Thread"
      className="absolute inset-0 z-20 flex flex-col bg-white lg:static lg:z-auto lg:w-[380px] lg:shrink-0 lg:border-l lg:border-neutral-200 dark:bg-neutral-950 lg:dark:border-neutral-800"
    >
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold">Thread</h2>
          <p className="text-xs text-neutral-500"># {channel.name}</p>
        </div>
        <button
          type="button"
          aria-label="Close thread"
          onClick={onClose}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="size-4" />
        </button>
      </header>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto pb-3">
        <MessageItem message={parent} showHeader {...common} />
        <div className="my-2 flex items-center gap-3 px-4 text-xs text-neutral-500 sm:px-6">
          <span>
            {count} {count === 1 ? "reply" : "replies"}
          </span>
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>
        {isPending && (
          <div className="flex flex-col gap-2 px-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        )}
        {replies?.map((reply, i) => (
          <MessageItem
            key={reply.id}
            message={reply}
            showHeader={i === 0 || replies[i - 1]!.author.id !== reply.author.id}
            {...common}
          />
        ))}
      </div>
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <ChatComposer
          compact
          autoFocus
          members={channel.members}
          placeholder="Reply…"
          onSubmit={(body) => send.mutateAsync(body).catch(() => toast.error("Could not send the reply"))}
        />
      </div>
    </aside>
  );
}

export default ThreadPanel;
