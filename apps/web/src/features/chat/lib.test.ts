import { describe, expect, it } from "vitest";
import {
  applyPoll,
  buildRows,
  dayLabel,
  mentionQuery,
  newestServerId,
  parseInline,
  parseMessage,
  prependHistory,
} from "./lib";
import type { ChatMessage, ChatState } from "./types";

const UID = "11111111-1111-4111-8111-111111111111";
const ME = { id: "me", name: "Me", email: null, avatarColor: null };
const MAYA = { id: "maya", name: "Maya", email: null, avatarColor: null };

const msg = (id: string, createdAt: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  channelId: "c",
  parentId: null,
  body: id,
  createdAt,
  updatedAt: createdAt,
  editedAt: null,
  author: MAYA,
  reactions: [],
  mentions: [],
  task: null,
  replyCount: 0,
  lastReplyAt: null,
  ...extra,
});

describe("parseInline", () => {
  it("finds mentions, code, bold, italic, links and bare urls", () => {
    expect(
      parseInline(`Hi @[Maya Chen](${UID}) **now** \`npm i\` *soon* [docs](https://a.dev/x) https://b.dev/y.`),
    ).toEqual([
      { type: "text", text: "Hi " },
      { type: "mention", name: "Maya Chen", userId: UID },
      { type: "text", text: " " },
      { type: "bold", text: "now" },
      { type: "text", text: " " },
      { type: "code", text: "npm i" },
      { type: "text", text: " " },
      { type: "italic", text: "soon" },
      { type: "text", text: " " },
      { type: "link", text: "docs", href: "https://a.dev/x" },
      { type: "text", text: " " },
      { type: "link", text: "https://b.dev/y", href: "https://b.dev/y" },
      { type: "text", text: "." },
    ]);
  });

  it("leaves lone asterisks and math alone", () => {
    expect(parseInline("2 * 3 * 4")).toEqual([{ type: "text", text: "2 * 3 * 4" }]);
  });
});

describe("parseMessage", () => {
  it("splits fenced code blocks from text and drops the language line", () => {
    expect(parseMessage("Try this:\n```js\nconst a = 1;\n```\nthen reload")).toEqual([
      { type: "text", inlines: [{ type: "text", text: "Try this:" }] },
      { type: "code", text: "const a = 1;" },
      { type: "text", inlines: [{ type: "text", text: "then reload" }] },
    ]);
  });

  it("keeps an unclosed fence as text", () => {
    expect(parseMessage("a ```b")).toEqual([{ type: "text", inlines: [{ type: "text", text: "a ```b" }] }]);
  });
});

describe("dayLabel", () => {
  const now = new Date(2026, 9, 8, 15, 0);
  it("says Today, Yesterday, then the date", () => {
    expect(dayLabel(new Date(2026, 9, 8, 1).toISOString(), now)).toBe("Today");
    expect(dayLabel(new Date(2026, 9, 7, 23).toISOString(), now)).toBe("Yesterday");
    expect(dayLabel(new Date(2026, 9, 5, 12).toISOString(), now)).not.toMatch(/Today|Yesterday|2026/);
    expect(dayLabel(new Date(2025, 9, 5, 12).toISOString(), now)).toMatch(/2025/);
  });
});

describe("buildRows", () => {
  const t = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();
  const now = new Date(2026, 9, 8, 18);

  it("adds day separators, groups an author's close messages and marks the first unread", () => {
    const rows = buildRows(
      [
        msg("a", t(7, 10)),
        msg("b", t(8, 9)),
        msg("c", t(8, 9, 2)),
        msg("d", t(8, 9, 3), { author: ME }),
        msg("e", t(8, 11)),
        msg("f", t(8, 11, 1)),
      ],
      { lastReadAt: t(8, 10), viewerId: "me", now },
    );
    expect(rows.map((r) => (r.type === "message" ? `${r.key}${r.showHeader ? "*" : ""}` : r.type === "day" ? r.label : "NEW"))).toEqual([
      "Yesterday",
      "a*",
      "Today",
      "b*",
      "c",
      "d*",
      "NEW",
      "e*",
      "f",
    ]);
  });

  it("shows no unread line when everything was read", () => {
    const rows = buildRows([msg("a", t(8, 9))], { lastReadAt: t(8, 10), viewerId: "me", now });
    expect(rows.some((r) => r.type === "new")).toBe(false);
  });
});

describe("polling merges", () => {
  const state = (messages: ChatMessage[]): ChatState => ({ messages, hasMore: true, serverTime: "t0" });

  it("adds new messages, updates held ones, drops deleted ones and optimistic copies", () => {
    const before = state([
      msg("a", "2026-10-08T10:00:00.000Z"),
      msg("b", "2026-10-08T10:01:00.000Z"),
      msg("temp-1", "2026-10-08T10:02:00.000Z", { author: ME, body: "hello", pending: true }),
    ]);
    const after = applyPoll(before, {
      messages: [msg("c", "2026-10-08T10:02:01.000Z", { author: ME, body: "hello" })],
      hasMore: false,
      updated: [msg("a", "2026-10-08T10:00:00.000Z", { body: "edited" }), msg("zz", "2026-10-01T10:00:00.000Z")],
      deletedIds: ["b"],
      serverTime: "t1",
    });
    expect(after.messages.map((m) => `${m.id}:${m.body}`)).toEqual(["a:edited", "c:hello"]);
    expect(after.serverTime).toBe("t1");
    expect(after.hasMore).toBe(true);
  });

  it("prepends history without duplicates and finds the newest server id", () => {
    const s = prependHistory(state([msg("b", "2026-10-08T10:01:00.000Z")]), {
      messages: [msg("a", "2026-10-08T10:00:00.000Z"), msg("b", "2026-10-08T10:01:00.000Z")],
      hasMore: false,
      updated: [],
      deletedIds: [],
      serverTime: "t",
    });
    expect(s.messages.map((m) => m.id)).toEqual(["a", "b"]);
    expect(s.hasMore).toBe(false);
    expect(newestServerId([...s.messages, msg("temp-2", "2026-10-08T11:00:00.000Z")])).toBe("b");
  });
});

describe("mentionQuery", () => {
  it("returns the query being typed after @", () => {
    expect(mentionQuery("hi @ma", 6)).toEqual({ query: "ma", start: 3 });
    expect(mentionQuery("@", 1)).toEqual({ query: "", start: 0 });
    expect(mentionQuery("me@mail", 7)).toBeUndefined();
  });
});
