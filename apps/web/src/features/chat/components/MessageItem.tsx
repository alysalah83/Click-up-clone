"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquareText, MoreHorizontal, SmilePlus } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import { cn } from "@/shared/lib/utils/cn";
import { useDeleteMessage, useEditMessage, useToggleReaction } from "../hooks/useChat";
import { plainText, stampLabel, taskHref, timeLabel } from "../lib";
import type { ChatMessage, ChatUser } from "../types";
import ChatComposer from "./ChatComposer";
import MessageBody from "./MessageBody";
import TurnIntoTask from "./TurnIntoTask";

const QUICK_EMOJIS = ["👍", "❤️", "😄", "🎉", "👀", "🚀", "✅", "🙏"];

const ACTION =
  "flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

interface MessageItemProps {
  message: ChatMessage;
  showHeader: boolean;
  viewerId: string;
  members: ChatUser[];
  workspaceId: string;
  /** Omitted inside the thread panel. */
  onOpenThread?: (message: ChatMessage) => void;
  highlighted?: boolean;
}

function MessageItem({
  message,
  showHeader,
  viewerId,
  members,
  workspaceId,
  onOpenThread,
  highlighted,
}: MessageItemProps) {
  const [editing, setEditing] = useState(false);
  const [menus, setMenus] = useState(0);
  const toggle = useToggleReaction(message.channelId);
  const edit = useEditMessage(message.channelId);
  const remove = useDeleteMessage(message.channelId);
  const mine = message.author.id === viewerId;
  const canAct = !message.pending;
  const keepToolbar = menus > 0;
  const trackMenu = (open: boolean) => setMenus((n) => Math.max(0, n + (open ? 1 : -1)));
  const nameOf = (id: string) => {
    const user = members.find((m) => m.id === id);
    return id === viewerId ? "You" : user ? displayName(user) : "Someone";
  };

  const react = (emoji: string) =>
    toggle.mutate({ id: message.id, emoji }, { onError: () => toast.error("Could not react") });

  const onDelete = () => {
    if (!window.confirm("Delete this message?")) return;
    remove.mutate(message, { onError: () => toast.error("Could not delete the message") });
  };

  return (
    <div
      id={`chat-msg-${message.id}`}
      className={cn(
        "group relative flex gap-3 px-4 py-0.5 transition-colors hover:bg-neutral-50 sm:px-6 dark:hover:bg-neutral-900/60",
        showHeader && "mt-2.5 pt-1.5",
        message.pending && "opacity-60",
        highlighted && "bg-amber-50 dark:bg-amber-400/10",
      )}
    >
      <div className="w-8 shrink-0">
        {showHeader ? (
          <UserAvatar user={message.author} size="md" />
        ) : (
          <time
            dateTime={message.createdAt}
            className="invisible block pt-1 text-right text-[10px] text-neutral-400 tabular-nums group-hover:visible"
          >
            {timeLabel(message.createdAt).replace(/\s?[AP]M$/, "")}
          </time>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {displayName(message.author)}
            </span>
            <time dateTime={message.createdAt} className="text-xs text-neutral-500">
              {message.pending ? "Sending…" : stampLabel(message.createdAt)}
            </time>
          </div>
        )}

        {editing ? (
          <div className="mt-1 mb-1.5">
            <ChatComposer
              compact
              autoFocus
              members={members}
              initialValue={message.body}
              placeholder="Edit message"
              onCancel={() => setEditing(false)}
              onSubmit={(body) =>
                edit.mutateAsync({ id: message.id, body }).then(
                  () => setEditing(false),
                  () => toast.error("Could not save the message"),
                )
              }
            />
          </div>
        ) : (
          <MessageBody body={message.body} viewerId={viewerId} />
        )}
        {message.editedAt && !editing && <span className="text-[11px] text-neutral-400">(edited)</span>}

        {message.task && (
          <Link
            href={taskHref(message.task)}
            className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 shadow-xs hover:border-violet-400 hover:text-violet-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:text-violet-300"
          >
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="text-neutral-500">Task</span>
            <span className="truncate">{message.task.name}</span>
          </Link>
        )}

        {message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {message.reactions.map((r) => {
              const reacted = r.userIds.includes(viewerId);
              return (
                <button
                  key={r.emoji}
                  type="button"
                  disabled={!canAct}
                  onClick={() => react(r.emoji)}
                  title={r.userIds.map(nameOf).join(", ")}
                  aria-pressed={reacted}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                    reacted
                      ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500/60 dark:bg-violet-500/15 dark:text-violet-200"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
                  )}
                >
                  <span>{r.emoji}</span>
                  <span className="tabular-nums">{r.userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {onOpenThread && message.replyCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenThread(message)}
            className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-md py-0.5 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-300"
          >
            <MessageSquareText className="size-3.5" aria-hidden />
            {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
            {message.lastReplyAt && (
              <span className="font-normal text-neutral-500">· Last reply {stampLabel(message.lastReplyAt)}</span>
            )}
          </button>
        )}
      </div>

      {canAct && !editing && (
        <div
          className={cn(
            "absolute -top-3.5 right-4 z-10 flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5 shadow-sm sm:right-6 dark:border-neutral-700 dark:bg-neutral-900",
            keepToolbar ? "flex" : "hidden group-focus-within:flex group-hover:flex",
          )}
        >
          <Popover onOpenChange={trackMenu}>
            <PopoverTrigger asChild>
              <button type="button" aria-label="Add reaction" title="Add reaction" className={ACTION}>
                <SmilePlus className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="flex w-auto gap-0.5 p-1" align="end">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`React ${emoji}`}
                  onClick={() => react(emoji)}
                  className="cursor-pointer rounded p-1 text-lg leading-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {emoji}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          {onOpenThread && (
            <button
              type="button"
              aria-label="Reply in thread"
              title="Reply in thread"
              onClick={() => onOpenThread(message)}
              className={ACTION}
            >
              <MessageSquareText className="size-4" />
            </button>
          )}
          {!message.task && (
            <TurnIntoTask message={message} workspaceId={workspaceId} onOpenChange={trackMenu} triggerClassName={ACTION} />
          )}
          <DropdownMenu onOpenChange={trackMenu}>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="More actions" title="More actions" className={ACTION}>
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  navigator.clipboard?.writeText(plainText(message.body)).then(
                    () => toast.success("Copied"),
                    () => toast.error("Could not copy"),
                  )
                }
              >
                Copy text
              </DropdownMenuItem>
              {mine && <DropdownMenuItem onSelect={() => setEditing(true)}>Edit message</DropdownMenuItem>}
              {mine && (
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  Delete message
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

export default memo(MessageItem);
