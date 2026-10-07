import { randomUUID } from "node:crypto";
import { mentionedUserIds } from "@clickup/shared";
import type { DemoRows } from "./demoWorkspace.js";

/**
 * Demo chat: a #product channel with two days of team conversation (standup, a bug that was
 * turned into a task, a decision with a thread) and a quieter #marketing channel. The guest is
 * @mentioned (Inbox) and has unread messages (sidebar badge). Pure, so the rows join the guest's
 * single batched `$transaction`.
 */

const MINUTE = 60 * 1000;

type Who = "guest" | "Maya" | "Liam" | "Sofia" | "Noah" | "Ava" | "Ethan";
type Say = (who: Who) => string;

type DemoMessage = {
  key: string;
  author: Who;
  /** Minutes ago. */
  at: number;
  body: (m: Say) => string;
  replyTo?: string;
  reactions?: [emoji: string, who: Who[]][];
  /** Turned into this existing demo task. */
  task?: string;
};

type DemoChannel = {
  space: string;
  name: string;
  topic: string;
  /** The guest read everything up to this many minutes ago. */
  guestReadAt: number;
  messages: DemoMessage[];
};

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

export const DEMO_CHANNELS: DemoChannel[] = [
  {
    space: "product",
    name: "product",
    topic: "Sprint 14 standups, bugs and product decisions",
    guestReadAt: h(8),
    messages: [
      {
        key: "standup", author: "Maya", at: h(31, 10),
        body: () =>
          "Morning team ☀️ Standup notes for **Sprint 14**:\n" +
          "• SSO: consent screen approved, callback handling in review\n" +
          "• Rate limiting: proposal is in the task, `600 req/min` per workspace\n" +
          "• Board virtualization starts tomorrow",
        reactions: [["👍", ["Liam", "Noah", "Sofia"]]],
      },
      {
        key: "pair", author: "Liam", at: h(31),
        body: (m) => `Thanks! I'll pair with ${m("Noah")} on the rate limiter this afternoon.`,
      },
      { key: "load", author: "Noah", at: h(30, 52), body: () => "Sounds good, I'll bring the load-test numbers 📈" },
      {
        key: "billing", author: "Sofia", at: h(29, 5),
        body: (m) =>
          `Quick one: Stripe webhook retries are still firing twice in staging. ${m("guest")} could you take a look when you're free?`,
      },
      {
        key: "billing-ack", author: "guest", at: h(28, 40),
        body: () => "On it. Looks like the idempotency key is scoped per endpoint, not per event.",
        reactions: [["🙏", ["Sofia"]]],
      },
      {
        key: "csv-bug", author: "Ethan", at: h(21, 15),
        body: () =>
          "Found a bug: CSV export breaks non-Latin characters.\nExporting a list with `Café ☕` gives `CafÃ©` in Excel.",
        reactions: [["👀", ["Liam", "Maya"]]],
        task: "bugs.csv-encoding",
      },
      {
        key: "csv-fix", author: "Liam", at: h(21),
        body: () =>
          "We write the file as latin1. It should be UTF-8 with a BOM so Excel opens it right:\n" +
          "```\nres.setHeader(\"Content-Type\", \"text/csv; charset=utf-8\");\nres.write(\"\\uFEFF\" + csv);\n```",
      },
      {
        key: "csv-task", author: "Ethan", at: h(20, 48),
        body: () => "Makes sense. I turned my first message into a task in **Bug Tracker** so it doesn't get lost.",
        reactions: [["✅", ["Maya"]]],
      },
      {
        key: "csv-plus", author: "Ava", at: h(19, 30),
        body: () => "Customers on the German newsletter list hit this too. +1 for fixing it this sprint 🇩🇪",
      },
      {
        key: "decision", author: "Maya", at: h(7, 5),
        body: () => "Decision time on dark mode for dashboard charts: ship it in **v2.4**, or wait for the new palette?",
      },
      {
        key: "decision-ava", author: "Ava", at: h(6, 58), replyTo: "decision",
        body: () => "If it ships, marketing can feature it in the October newsletter 🎉",
      },
      {
        key: "decision-noah", author: "Noah", at: h(6, 50),
        body: () => "Ship now. The palette swap is just a token change later.",
        reactions: [["💯", ["Sofia", "Liam"]]],
      },
      {
        key: "decision-sofia", author: "Sofia", at: h(6, 31),
        body: () => "Agree with Noah. Design notes are here: https://example.com/design/dark-charts",
      },
      {
        key: "decided", author: "Maya", at: h(6, 2),
        body: (m) =>
          `**Decision:** dark-mode charts ship in v2.4 ✅ The new palette follows in v2.5.\n${m("guest")} can you add it to the release notes?`,
        reactions: [["🎉", ["Noah", "Sofia", "Ethan"]]],
      },
      {
        key: "decided-maya", author: "Maya", at: h(5, 55), replyTo: "decision",
        body: () => "Great, adding it to the newsletter brief.",
      },
      {
        key: "limiter", author: "Liam", at: h(3, 12),
        body: () => "Rate limiter is merged behind a flag. `RATE_LIMIT_ENABLED=true` on staging now.",
      },
      {
        key: "p95", author: "Noah", at: h(2, 34),
        body: () => "Load test with the limiter on: p95 went from **180 ms** to **185 ms**. Negligible.",
        reactions: [["🚀", ["Maya", "Liam"]]],
      },
      {
        key: "review", author: "Ethan", at: h(1, 26),
        body: (m) => `${m("guest")} the CSV fix is ready for review whenever you have a minute 🙌`,
      },
      {
        key: "cutoff", author: "Maya", at: 38,
        body: () => "Reminder: release cutoff is today at 5 pm. Anything not merged moves to Sprint 15.",
      },
    ],
  },
  {
    space: "marketing",
    name: "marketing",
    topic: "Launch plans, content and campaigns",
    guestReadAt: h(4),
    messages: [
      {
        key: "m-thread", author: "Ava", at: h(26),
        body: () => "Launch thread draft is in the doc. Feedback welcome before Thursday!",
        reactions: [["👍", ["Sofia"]]],
      },
      {
        key: "m-subject", author: "Sofia", at: h(9, 20),
        body: () => "Newsletter subject line A/B: *What shipped in October* vs *Your October update*. I like the first one.",
      },
      {
        key: "m-vote", author: "Ava", at: h(9),
        body: () => "First one, it's more specific 👌",
        reactions: [["➕", ["Sofia", "guest"]]],
      },
      {
        key: "m-video", author: "Sofia", at: h(1, 5),
        body: (m) => `The 90-second demo video is rendering. ${m("Ava")} can you check the captions after lunch?`,
      },
    ],
  },
];

type Teammate = { id: string; name: string | null };

export function buildDemoChat({
  ownerUserId,
  seed,
  teammates,
  now = new Date(),
}: {
  ownerUserId: string;
  seed: Pick<DemoRows, "idsByKey">;
  teammates: Teammate[];
  now?: Date;
}) {
  const userId = (who: Who) => {
    if (who === "guest") return ownerUserId;
    const user = teammates.find((t) => t.name?.startsWith(who));
    if (!user) throw new Error(`Demo teammate "${who}" not found`);
    return user.id;
  };
  const nameOf = (who: Who) => (who === "guest" ? "Guest" : teammates.find((t) => t.id === userId(who))!.name!);
  const mention: Say = (who) => `@[${nameOf(who)}](${userId(who)})`;
  const ago = (minutes: number) => new Date(now.getTime() - minutes * MINUTE);

  const channels: { id: string; workspaceId: string; name: string; topic: string; createdById: string; createdAt: Date; updatedAt: Date }[] = [];
  const messages: {
    id: string;
    channelId: string;
    authorId: string;
    parentId: string | null;
    body: string;
    taskId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const reactions: { messageId: string; userId: string; emoji: string; createdAt: Date }[] = [];
  const mentions: { messageId: string; userId: string }[] = [];
  const reads: { channelId: string; userId: string; lastReadAt: Date }[] = [];
  const notifications: {
    userId: string;
    actorId: string;
    type: "MENTIONED";
    chatMessageId: string;
    message: string;
    readAt: Date | null;
    createdAt: Date;
  }[] = [];

  for (const channel of DEMO_CHANNELS) {
    const workspaceId = seed.idsByKey.get(channel.space);
    if (!workspaceId) continue;
    const channelId = randomUUID();
    const created = ago(h(72));
    channels.push({
      id: channelId,
      workspaceId,
      name: channel.name,
      topic: channel.topic,
      createdById: userId("Maya"),
      createdAt: created,
      updatedAt: created,
    });
    reads.push({ channelId, userId: ownerUserId, lastReadAt: ago(channel.guestReadAt) });

    const ids = new Map(channel.messages.map((m) => [m.key, randomUUID()]));
    // Parents before replies, so the batch never references a row that is not written yet.
    const ordered = [...channel.messages].sort((a, b) => Number(!!a.replyTo) - Number(!!b.replyTo));
    for (const m of ordered) {
      const id = ids.get(m.key)!;
      const body = m.body(mention);
      const lastReply = channel.messages.filter((r) => r.replyTo === m.key).reduce((min, r) => Math.min(min, r.at), m.at);
      messages.push({
        id,
        channelId,
        authorId: userId(m.author),
        parentId: m.replyTo ? ids.get(m.replyTo)! : null,
        body,
        taskId: m.task ? (seed.idsByKey.get(m.task) ?? null) : null,
        createdAt: ago(m.at),
        updatedAt: ago(lastReply),
      });
      for (const [emoji, who] of m.reactions ?? [])
        for (const w of who) reactions.push({ messageId: id, userId: userId(w), emoji, createdAt: ago(m.at - 2) });
      const mentioned = mentionedUserIds(body);
      for (const u of mentioned) mentions.push({ messageId: id, userId: u });
      if (mentioned.includes(ownerUserId.toLowerCase()) && m.author !== "guest")
        notifications.push({
          userId: ownerUserId,
          actorId: userId(m.author),
          type: "MENTIONED",
          chatMessageId: id,
          message: `${nameOf(m.author)} mentioned you in #${channel.name}`,
          readAt: m.at > channel.guestReadAt ? ago(channel.guestReadAt) : null,
          createdAt: ago(m.at),
        });
    }
  }

  return { channels, messages, reactions, mentions, reads, notifications };
}
