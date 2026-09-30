import { randomUUID } from "node:crypto";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Time tracking and recurring-task demo content, attached to the demo workspace by task key.
 * Pure (no queries), so the rows join the guest's single batched `$transaction`.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** Two repeating tasks: a fortnightly retrospective and a monthly newsletter. */
export const DEMO_RECURRING = [
  { task: "sprint.retro", recurrenceType: "custom", recurrenceInterval: 14 },
  { task: "content.newsletter", recurrenceType: "monthly", recurrenceInterval: 1 },
] as const;

/** Sets the recurrence on the seeded task rows in place, so it runs before the tasks are written. */
export function applyDemoRecurrence(seed: DemoRows) {
  for (const { task, recurrenceType, recurrenceInterval } of DEMO_RECURRING) {
    const id = seed.idsByKey.get(task);
    const row = id ? seed.tasks.find((t) => t.id === id) : undefined;
    if (row) Object.assign(row, { recurrenceType, recurrenceInterval });
  }
}

type Who = "guest" | "Maya" | "Liam" | "Sofia" | "Noah" | "Ava" | "Ethan";

/** [who, task key, hours ago it started, minutes worked]; all inside the last 6 days. */
const DEMO_TIME: [Who, string, number, number][] = [
  ["Maya", "sprint.sso", 5, 95],
  ["Maya", "sprint.sso", 29, 140],
  ["Maya", "sprint.dark-mode-charts", 53, 75],
  ["Maya", "launch.landing-page", 77, 120],
  ["Liam", "sprint.api-rate-limit", 6, 150],
  ["Liam", "sprint.api-rate-limit", 31, 110],
  ["Liam", "bugs.memory-leak", 55, 85],
  ["Liam", "sprint.board-virtualization", 100, 180],
  ["Sofia", "sprint.billing-webhooks", 8, 130],
  ["Sofia", "sprint.billing-webhooks", 34, 90],
  ["Sofia", "launch.pricing-page", 58, 65],
  ["Noah", "bugs.memory-leak", 10, 100],
  ["Noah", "bugs.slow-dashboard", 36, 120],
  ["Noah", "bugs.timezone-dates", 82, 55],
  ["Ava", "content.launch-thread", 12, 70],
  ["Ava", "content.newsletter", 38, 95],
  ["Ava", "content.case-study", 60, 105],
  ["Ethan", "bugs.memory-leak", 14, 60],
  ["Ethan", "launch.demo-video", 40, 145],
  ["Ethan", "launch.press-kit", 86, 45],
  ["guest", "sprint.sso", 4, 50],
  ["guest", "sprint.billing-webhooks", 27, 80],
  ["guest", "sprint.flaky-e2e", 52, 65],
  ["guest", "bugs.memory-leak", 76, 40],
  ["guest", "sprint.release-notes", 104, 30],
];

export function buildDemoTimeEntries({
  ownerUserId,
  seed,
  teammates,
  now = new Date(),
}: {
  ownerUserId: string;
  seed: DemoRows;
  teammates: { id: string; name: string }[];
  now?: Date;
}) {
  const userIds = new Map<string, string>([["guest", ownerUserId]]);
  for (const t of teammates) userIds.set(t.name.split(" ")[0]!, t.id);

  return DEMO_TIME.flatMap(([who, taskKey, hoursAgo, minutes]) => {
    const taskId = seed.idsByKey.get(taskKey);
    const userId = userIds.get(who);
    if (!taskId || !userId) return [];
    const startedAt = new Date(now.getTime() - hoursAgo * HOUR);
    return [
      {
        id: randomUUID(),
        taskId,
        userId,
        startedAt,
        endedAt: new Date(startedAt.getTime() + minutes * MINUTE),
        durationSec: minutes * 60,
      },
    ];
  });
}
