"use client";

import { format, formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import { activitySentence } from "../lib/activitySentence";
import type { ActivityEntry } from "../types";

function ActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0)
    return (
      <p className="px-5 py-4 text-sm text-neutral-500">No activity yet.</p>
    );

  return (
    <ol className="flex flex-col gap-4 px-5 py-4">
      {activity.map((entry) => {
        const createdAt = new Date(entry.createdAt);
        return (
          <li key={entry.id} className="flex gap-2.5 text-sm">
            <UserAvatar user={entry.actor} size="sm" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="leading-snug text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {displayName(entry.actor)}
                </span>{" "}
                {activitySentence(entry).map((part, i) =>
                  part.strong ? (
                    <span
                      key={i}
                      className="font-medium text-neutral-800 dark:text-neutral-200"
                    >
                      {part.text}
                    </span>
                  ) : (
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </p>
              <time
                dateTime={entry.createdAt}
                title={format(createdAt, "MMM d, yyyy 'at' h:mm a")}
                className="text-xs text-neutral-400 dark:text-neutral-500"
              >
                {formatDistanceToNow(createdAt, { addSuffix: true })}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default ActivityFeed;
