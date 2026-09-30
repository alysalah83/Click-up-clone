import { randomUUID } from "node:crypto";
import { COMMENT_MENTION_REGEX, type NotificationType } from "@clickup/shared";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Step 4-6 demo content, attached to the demo workspace by task key: threaded comments with
 * @mentions and reactions, tasks assigned to the guest (My Work) and inbox notifications.
 * Pure (no queries), so the rows join the guest's single batched `$transaction`.
 */

const HOUR = 60 * 60 * 1000;

type Who = "guest" | "Maya" | "Liam" | "Sofia" | "Noah" | "Ava" | "Ethan";
type Say = (who: Who) => string;

type DemoComment = {
  key: string;
  task: string;
  author: Who;
  body: (m: Say) => string;
  /** Key of the comment this replies to. */
  replyTo?: string;
  hoursAgo: number;
  reactions?: [emoji: string, who: Who[]][];
};

export const DEMO_COMMENTS: DemoComment[] = [
  {
    key: "sso1", task: "sprint.sso", author: "Maya", hoursAgo: 30,
    body: (m) => `Consent screen is approved 🎉 ${m("guest")} can you review the callback handling for denied consent?`,
    reactions: [["👍", ["Liam", "Noah"]], ["🎉", ["Sofia"]]],
  },
  {
    key: "sso2", task: "sprint.sso", author: "guest", hoursAgo: 28, replyTo: "sso1",
    body: () => "On it. I'll also check the account-linking edge case with unverified emails.",
    reactions: [["👍", ["Maya"]]],
  },
  {
    key: "sso3", task: "sprint.sso", author: "Liam", hoursAgo: 26, replyTo: "sso1",
    body: () => "Heads up: the staging redirect URI still points at the old domain.",
  },
  {
    key: "rate1", task: "sprint.api-rate-limit", author: "Liam", hoursAgo: 20,
    body: (m) => `Proposal: 600 req/min per workspace with a burst of 100. ${m("Maya")} ${m("Sofia")} thoughts?`,
    reactions: [["👀", ["Maya", "Sofia"]]],
  },
  {
    key: "rate2", task: "sprint.api-rate-limit", author: "Maya", hoursAgo: 18, replyTo: "rate1",
    body: () => "600 works for most customers. Enterprise gets a higher tier through a header override.",
  },
  {
    key: "rate3", task: "sprint.api-rate-limit", author: "guest", hoursAgo: 17, replyTo: "rate1",
    body: () => "Agreed. I'll return `Retry-After` so CI clients back off nicely.",
    reactions: [["❤️", ["Liam"]]],
  },
  {
    key: "bill1", task: "sprint.billing-webhooks", author: "Sofia", hoursAgo: 50,
    body: (m) => `${m("guest")} this is overdue: Stripe retries are hitting the handler twice in staging.`,
    reactions: [["😬", ["guest"]]],
  },
  {
    key: "bill2", task: "sprint.billing-webhooks", author: "guest", hoursAgo: 46, replyTo: "bill1",
    body: () => "Found it: the idempotency key is scoped per endpoint, not per event. Fix in progress.",
    reactions: [["🙏", ["Sofia", "Noah"]]],
  },
  {
    key: "leak1", task: "bugs.memory-leak", author: "Noah", hoursAgo: 70,
    body: () => "Heap snapshot is attached in the sprint doc. Looks like detached listeners on board unmount.",
  },
  {
    key: "leak2", task: "bugs.memory-leak", author: "Ethan", hoursAgo: 60,
    body: (m) => `I can reproduce it in 3 board switches. ${m("guest")} could this be the drag layer?`,
  },
  {
    key: "leak3", task: "bugs.memory-leak", author: "guest", hoursAgo: 58, replyTo: "leak2",
    body: () => "Likely. I'll dig into it today.",
    reactions: [["👍", ["Ethan"]]],
  },
  {
    key: "thread1", task: "content.launch-thread", author: "Ava", hoursAgo: 12,
    body: (m) => `The draft thread is in the doc. I need a stat for tweet 3, ${m("Maya")}?`,
  },
  {
    key: "news1", task: "content.newsletter", author: "Sofia", hoursAgo: 8,
    body: () => "Subject line A/B: 'What shipped in October' vs 'Your October update'. I like the first one.",
    reactions: [["👍", ["Ava", "guest", "Maya"]]],
  },
  {
    key: "price1", task: "launch.pricing-page", author: "Liam", hoursAgo: 40,
    body: (m) => `Blocked on final copy for the Team tier. ${m("guest")} FYI.`,
  },
  {
    key: "notes1", task: "sprint.release-notes", author: "Maya", hoursAgo: 5,
    body: () => "The v2.4 draft is ready for review. No rush before today's cutoff.",
  },
];

/** Tasks assigned to the guest: spread over overdue, today, upcoming and no due date. */
export const GUEST_TASKS = [
  "sprint.billing-webhooks", // overdue
  "sprint.flaky-e2e", // overdue
  "bugs.memory-leak", // overdue
  "sprint.api-rate-limit", // today
  "sprint.release-notes", // today
  "content.launch-thread", // today
  "sprint.sso", // upcoming
  "sprint.board-virtualization", // upcoming
  "content.newsletter", // upcoming
  "sprint.notification-prefs", // no date
];

type DemoNotification = {
  type: NotificationType;
  task: string;
  actor: Exclude<Who, "guest">;
  message: string;
  comment?: string;
  hoursAgo: number;
  read: boolean;
};

const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { type: "MENTIONED", task: "sprint.sso", actor: "Maya", comment: "sso1", hoursAgo: 30, read: false,
    message: 'Maya Chen mentioned you in "Add Google SSO to the login page"' },
  { type: "COMMENTED", task: "sprint.sso", actor: "Liam", comment: "sso3", hoursAgo: 26, read: false,
    message: 'Liam Patel commented on "Add Google SSO to the login page"' },
  { type: "MENTIONED", task: "launch.pricing-page", actor: "Liam", comment: "price1", hoursAgo: 40, read: false,
    message: 'Liam Patel mentioned you in "Update pricing page for the new tiers"' },
  { type: "MENTIONED", task: "sprint.billing-webhooks", actor: "Sofia", comment: "bill1", hoursAgo: 50, read: false,
    message: 'Sofia Garcia mentioned you in "Handle Stripe billing webhooks idempotently"' },
  { type: "TASK_UPDATED", task: "bugs.memory-leak", actor: "Noah", hoursAgo: 64, read: false,
    message: 'Noah Kim changed the status of "Memory leak when switching boards quickly"' },
  { type: "MENTIONED", task: "bugs.memory-leak", actor: "Ethan", comment: "leak2", hoursAgo: 60, read: true,
    message: 'Ethan Brooks mentioned you in "Memory leak when switching boards quickly"' },
  { type: "TASK_UPDATED", task: "sprint.api-rate-limit", actor: "Liam", hoursAgo: 72, read: true,
    message: 'Liam Patel changed the priority of "Rate-limit the public API per workspace"' },
  { type: "ASSIGNED", task: "sprint.board-virtualization", actor: "Maya", hoursAgo: 96, read: true,
    message: 'Maya Chen assigned you to "Virtualize the board for lists with 1k+ tasks"' },
];

type Teammate = { id: string; name: string | null };

export function buildDemoCollab({
  ownerUserId,
  seed,
  teammates,
  existingAssignees,
  now = new Date(),
}: {
  ownerUserId: string;
  seed: DemoRows;
  teammates: Teammate[];
  /** Assignee rows already seeded, so the guest is not assigned twice. */
  existingAssignees: { taskId: string; userId: string }[];
  now?: Date;
}) {
  const idOfName = (name: string) => {
    const user = teammates.find((t) => t.name?.startsWith(name));
    if (!user) throw new Error(`Demo teammate "${name}" not found`);
    return user.id;
  };
  const userId = (who: Who) => (who === "guest" ? ownerUserId : idOfName(who));
  const displayName = (who: Who) =>
    who === "guest" ? "Guest" : teammates.find((t) => t.id === userId(who))!.name!;
  const mention: Say = (who) => `@[${displayName(who)}](${userId(who)})`;
  const taskId = (key: string) => {
    const id = seed.idsByKey.get(key);
    if (!id) throw new Error(`Demo task "${key}" not found`);
    return id;
  };
  const ago = (hours: number) => new Date(now.getTime() - hours * HOUR);

  const ids = new Map(DEMO_COMMENTS.map((c) => [c.key, randomUUID()]));
  // Parents before replies, so the batch never references a row that is not written yet.
  const ordered = [...DEMO_COMMENTS].sort((a, b) => Number(!!a.replyTo) - Number(!!b.replyTo));

  const comments = ordered.map((c) => ({
    id: ids.get(c.key)!,
    taskId: taskId(c.task),
    authorId: userId(c.author),
    parentId: c.replyTo ? ids.get(c.replyTo)! : null,
    body: c.body(mention),
    createdAt: ago(c.hoursAgo),
    updatedAt: ago(c.hoursAgo),
  }));

  const reactions = ordered.flatMap((c) =>
    (c.reactions ?? []).flatMap(([emoji, who]) =>
      who.map((w) => ({ commentId: ids.get(c.key)!, userId: userId(w), emoji, createdAt: ago(c.hoursAgo - 1) })),
    ),
  );

  const mentions = comments.flatMap((c) =>
    [...new Set([...c.body.matchAll(COMMENT_MENTION_REGEX)].map((m) => m[2]!))].map((id) => ({
      commentId: c.id,
      userId: id,
    })),
  );

  const taken = new Set(existingAssignees.map((a) => `${a.taskId}:${a.userId}`));
  const guestAssignees = GUEST_TASKS.map((key) => ({ taskId: taskId(key), userId: ownerUserId })).filter(
    (a) => !taken.has(`${a.taskId}:${a.userId}`),
  );

  const notifications = DEMO_NOTIFICATIONS.map((n) => ({
    userId: ownerUserId,
    actorId: idOfName(n.actor),
    type: n.type,
    taskId: taskId(n.task),
    commentId: n.comment ? ids.get(n.comment)! : null,
    message: n.message,
    readAt: n.read ? ago(n.hoursAgo - 1) : null,
    createdAt: ago(n.hoursAgo),
  }));

  return { comments, reactions, mentions, guestAssignees, notifications };
}
