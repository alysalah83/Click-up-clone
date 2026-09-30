"use client";

import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { useMarkAllRead, useMarkRead, useNotifications, type Notification } from "../hooks/useInbox";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

function relativeTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, ms] of UNITS) if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  return "just now";
}

function InboxView() {
  const { data, isPending, error } = useNotifications();
  const markAll = useMarkAllRead();
  const markRead = useMarkRead();
  const router = useRouter();

  const open = (n: Notification) => {
    if (!n.readAt) markRead.mutate(n.id);
    router.push(`/home/lists/${n.task.listId}/board?task=${n.task.id}`);
  };

  if (isPending)
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4" aria-busy="true">
        <Skeleton className="h-7 w-24" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  if (error) return <p className="p-6 text-sm text-destructive">Could not load notifications.</p>;
  const unread = data.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Inbox</h1>
        <Button
          variant="outline"
          size="sm"
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </div>
      {data.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-muted-foreground">
          <Inbox className="size-8" />
          <p className="text-sm">You are all caught up.</p>
        </div>
      )}
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {data.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => open(n)}
              className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-accent"
            >
              <UserAvatar user={n.actor} size="md" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`text-sm ${n.readAt ? "" : "font-semibold"}`}>{n.message}</span>
                <span className="truncate text-xs text-muted-foreground">{n.task.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</span>
              {!n.readAt && <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InboxView;
