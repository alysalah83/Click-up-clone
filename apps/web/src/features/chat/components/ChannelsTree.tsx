"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Hash, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils/cn";
import { useChannels, useCreateChannel, useDeleteChannel, useUpdateChannel } from "../hooks/useChat";
import { channelHref } from "../lib";
import type { ChatChannelSummary } from "../types";

function ChannelRow({ channel }: { channel: ChatChannelSummary }) {
  const router = useRouter();
  const { channelId } = useParams<{ channelId?: string }>();
  const update = useUpdateChannel();
  const remove = useDeleteChannel();
  const [renaming, setRenaming] = useState(false);
  const active = channelId === channel.id;
  const unread = active ? 0 : channel.unreadCount;

  const commitRename = (value: string) => {
    setRenaming(false);
    if (!value.trim() || value.trim() === channel.name) return;
    update.mutate(
      { id: channel.id, patch: { name: value } },
      { onError: (e) => toast.error(e instanceof Error ? e.message : "Could not rename") },
    );
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete #${channel.name} and all its messages?`)) return;
    try {
      await remove.mutateAsync(channel.id);
      if (active) router.push("/home/chat");
    } catch {
      toast.error("Could not delete the channel");
    }
  };

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 pl-1 text-sm hover:bg-neutral-500/15",
          active && "bg-violet-500/15 font-medium text-violet-700 dark:text-violet-300",
        )}
      >
        <Hash aria-hidden className={cn("size-3.5 shrink-0", unread ? "text-neutral-900 dark:text-white" : "text-neutral-500")} />
        {renaming ? (
          <input
            autoFocus
            defaultValue={channel.name}
            maxLength={80}
            aria-label="Rename channel"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commitRename(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="mx-1 min-w-0 flex-1 rounded border border-violet-400 bg-transparent px-1 py-0.5 outline-none"
          />
        ) : (
          <Link
            href={channelHref(channel.id)}
            className={cn("min-w-0 flex-1 truncate py-1.5 pl-0.5", unread > 0 && "font-semibold text-neutral-900 dark:text-white")}
          >
            {channel.name}
          </Link>
        )}
        {unread > 0 && (
          <span
            aria-label={`${unread} unread`}
            className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] leading-none font-bold text-white tabular-nums group-hover:hidden"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for #${channel.name}`}
              className={cn(
                "size-6 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-neutral-500/20 data-[state=open]:flex",
                unread > 0 ? "hidden group-hover:flex" : "flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
              )}
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function NewChannelButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const create = useCreateChannel();
  const [open, setOpen] = useState(false);

  const onSubmit = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    try {
      const channel = await create.mutateAsync({
        workspaceId,
        name: String(data.get("name") ?? ""),
        topic: String(data.get("topic") ?? "").trim() || undefined,
      });
      setOpen(false);
      router.push(channelHref(channel.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the channel");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="New channel"
          className="flex size-6 cursor-pointer items-center justify-center rounded hover:bg-neutral-500/20"
        >
          <Plus className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start" side="right">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(e.currentTarget);
          }}
        >
          <p className="text-sm font-semibold">Create a channel</p>
          <label className="flex items-center gap-1 rounded-md border border-neutral-300 px-2 focus-within:border-violet-500 dark:border-neutral-700">
            <Hash className="size-3.5 text-neutral-500" aria-hidden />
            <input
              name="name"
              required
              autoFocus
              maxLength={80}
              placeholder="e.g. design-reviews"
              aria-label="Channel name"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
            />
          </label>
          <input
            name="topic"
            maxLength={250}
            placeholder="Topic (optional)"
            aria-label="Channel topic"
            className="rounded-md border border-neutral-300 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-violet-500 dark:border-neutral-700"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create channel"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** The "Channels" section of a space in the sidebar: `# name` rows with unread badges and "+". */
function ChannelsTree({ workspaceId }: { workspaceId: string }) {
  const { data: channels, isPending, error } = useChannels();
  const spaceChannels = (channels ?? []).filter((c) => c.workspaceId === workspaceId);

  return (
    <div className="ml-auto flex w-[92%] flex-col gap-1 border-l border-neutral-300 pl-3 dark:border-neutral-700">
      <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-neutral-500 uppercase">
        <span>Channels</span>
        <NewChannelButton workspaceId={workspaceId} />
      </div>
      {isPending && <Skeleton className="h-6 w-full" />}
      {error && <p className="text-xs text-destructive">Could not load channels.</p>}
      {spaceChannels.length > 0 && (
        <ul className="flex flex-col">
          {spaceChannels.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default ChannelsTree;
