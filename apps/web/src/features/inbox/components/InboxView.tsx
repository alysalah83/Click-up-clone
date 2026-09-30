"use client";

import { useRouter } from "next/navigation";
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

  if (isPending) return <p className="p-6 text-sm text-neutral-500">Loading inbox...</p>;
  if (error) return <p className="p-6 text-sm text-red-500">Could not load notifications.</p>;
  const unread = data.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Inbox</h1>
        <button
          type="button"
          disabled={unread === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
          className="rounded-md border border-neutral-400 px-3 py-1 text-sm disabled:opacity-50"
        >
          Mark all read
        </button>
      </div>
      {data.length === 0 && <p className="text-sm text-neutral-500">You are all caught up.</p>}
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-300 dark:divide-neutral-800 dark:border-neutral-700">
        {data.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => open(n)}
              className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-neutral-500/10"
            >
              <UserAvatar user={n.actor} size="md" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`text-sm ${n.readAt ? "" : "font-semibold"}`}>{n.message}</span>
                <span className="truncate text-xs text-neutral-500">{n.task.name}</span>
              </span>
              <span className="shrink-0 text-xs text-neutral-500">{relativeTime(n.createdAt)}</span>
              {!n.readAt && <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InboxView;
