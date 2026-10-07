"use client";

import Link from "next/link";
import { Hash, MessagesSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useChannels } from "../hooks/useChat";
import { channelHref, stampLabel } from "../lib";
import type { ChatChannelSummary } from "../types";

/** /home/chat: every channel of my spaces, grouped by space, with unread counts. */
function ChatHome() {
  const { data: channels, isPending, error } = useChannels();

  const spaces = new Map<string, { name: string; channels: ChatChannelSummary[] }>();
  for (const c of channels ?? []) {
    const space = spaces.get(c.workspaceId) ?? { name: c.workspaceName, channels: [] };
    space.channels.push(c);
    spaces.set(c.workspaceId, space);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-semibold">Chat</h1>
        <p className="text-sm text-muted-foreground">
          Channels for each space. Mention teammates with @, react, reply in threads and turn messages into tasks.
        </p>
      </div>
      {isPending && (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">Could not load channels.</p>}
      {channels && channels.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-muted-foreground">
          <MessagesSquare className="size-8" />
          <p className="text-sm">No channels yet. Use the + next to “Channels” under a space in the sidebar.</p>
        </div>
      )}
      {[...spaces].map(([id, space]) => (
        <section key={id} className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{space.name}</h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {space.channels.map((c) => (
              <li key={c.id}>
                <Link href={channelHref(c.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-accent">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                    <Hash className="size-4" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={`text-sm ${c.unreadCount ? "font-semibold" : "font-medium"}`}>{c.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{c.topic || "No topic"}</span>
                  </span>
                  {c.lastMessageAt && (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{stampLabel(c.lastMessageAt)}</span>
                  )}
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white tabular-nums">
                      {c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default ChatHome;
