import type { ChatMessage, ChatMessagesPage, ChatState } from "./types";

// --- Markdown-lite ----------------------------------------------------------------------------

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "mention"; name: string; userId: string };

export type Block = { type: "code"; text: string } | { type: "text"; inlines: Inline[] };

const INLINE = new RegExp(
  [
    /@\[([^\]]{1,100})\]\(([0-9a-fA-F-]{36})\)/.source, // 1-2 mention
    /`([^`\n]+)`/.source, // 3 code
    /\*\*([^*\n]+?)\*\*/.source, // 4 bold
    /(?<![\w*])\*([^*\s][^*\n]*?)\*(?![\w*])/.source, // 5 italic
    /\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\)/.source, // 6-7 link
    /(https?:\/\/[^\s<>()]*[^\s<>().,!?;:'"])/.source, // 8 bare url
  ].join("|"),
  "g",
);

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) out.push({ type: "text", text: text.slice(last, index) });
    if (m[1] !== undefined) out.push({ type: "mention", name: m[1], userId: m[2]!.toLowerCase() });
    else if (m[3] !== undefined) out.push({ type: "code", text: m[3] });
    else if (m[4] !== undefined) out.push({ type: "bold", text: m[4] });
    else if (m[5] !== undefined) out.push({ type: "italic", text: m[5] });
    else if (m[6] !== undefined) out.push({ type: "link", text: m[6], href: m[7]! });
    else out.push({ type: "link", text: m[8]!, href: m[8]! });
    last = index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Splits a message into ``` code blocks and text blocks (line breaks are kept in the text). */
export function parseMessage(body: string): Block[] {
  const FENCE = "```";
  const parts = body.split(FENCE);
  // An unclosed last fence stays plain text.
  if (parts.length % 2 === 0) parts.splice(-2, 2, parts.at(-2) + FENCE + parts.at(-1));
  const blocks: Block[] = [];
  parts.forEach((part, i) => {
    // Odd parts sit between fences.
    if (i % 2 === 1) {
      const code = part.replace(/^[\w-]*\n/, "").replace(/\n$/, "");
      if (code) blocks.push({ type: "code", text: code });
      return;
    }
    let text = part;
    if (i > 0) text = text.replace(/^\n/, "");
    if (i < parts.length - 1) text = text.replace(/\n$/, "");
    if (text) blocks.push({ type: "text", inlines: parseInline(text) });
  });
  return blocks;
}

// --- Dates ------------------------------------------------------------------------------------

/** The app UI is English; dates follow it. */
const LOCALE = "en-US";
const DAY_MS = 86_400_000;
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today", "Yesterday", "Monday, October 6" (with the year when it is not this year). */
export function dayLabel(iso: string, now = new Date()) {
  const date = new Date(iso);
  const diff = Math.round((dayStart(now) - dayStart(date)) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
}

/** "Today 10:42", "Yesterday 9:05", "Oct 6 14:30". */
export function stampLabel(iso: string, now = new Date()) {
  const day = dayLabel(iso, now);
  const short =
    day === "Today" || day === "Yesterday"
      ? day
      : new Date(iso).toLocaleDateString(LOCALE, { month: "short", day: "numeric" });
  return `${short} ${timeLabel(iso)}`;
}

// --- Grouping ---------------------------------------------------------------------------------

const GROUP_GAP_MS = 5 * 60_000;

export type MessageRow =
  | { type: "day"; key: string; label: string }
  | { type: "new"; key: string }
  | { type: "message"; key: string; message: ChatMessage; showHeader: boolean };

/**
 * Rows for the message list: a separator per day, a "New" line before the first message after
 * `lastReadAt` (not mine), and a header (avatar, name, time) only when the author changes or a
 * few minutes passed.
 */
export function buildRows(
  messages: ChatMessage[],
  { lastReadAt, viewerId, now = new Date() }: { lastReadAt?: string | null; viewerId?: string; now?: Date } = {},
): MessageRow[] {
  const rows: MessageRow[] = [];
  let prev: ChatMessage | undefined;
  let newShown = lastReadAt === undefined;
  for (const message of messages) {
    const day = dayStart(new Date(message.createdAt));
    const newDay = !prev || dayStart(new Date(prev.createdAt)) !== day;
    if (newDay) rows.push({ type: "day", key: `day-${day}`, label: dayLabel(message.createdAt, now) });
    let isNew = false;
    if (
      !newShown &&
      message.author.id !== viewerId &&
      !message.pending &&
      (lastReadAt === null || new Date(message.createdAt) > new Date(lastReadAt!))
    ) {
      rows.push({ type: "new", key: "new" });
      newShown = true;
      isNew = true;
    }
    const showHeader =
      newDay ||
      isNew ||
      !prev ||
      prev.author.id !== message.author.id ||
      new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() > GROUP_GAP_MS;
    rows.push({ type: "message", key: message.id, message, showHeader });
    prev = message;
  }
  return rows;
}

// --- Cache merging ----------------------------------------------------------------------------

const byTime = (a: ChatMessage, b: ChatMessage) =>
  a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt);

export const isTemp = (id: string) => id.startsWith("temp-");

/** The newest message the server knows (cursor for `?after=`). */
export function newestServerId(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) if (!isTemp(messages[i]!.id)) return messages[i]!.id;
  return undefined;
}

/** Applies a poll: adds new messages, replaces changed ones we hold, drops deleted ones. */
export function applyPoll(state: ChatState, page: ChatMessagesPage): ChatState {
  const deleted = new Set(page.deletedIds);
  const arrived = page.messages.filter((m) => !state.messages.some((s) => s.id === m.id));
  const byId = new Map(state.messages.map((m) => [m.id, m]));
  for (const m of page.updated) if (byId.has(m.id)) byId.set(m.id, m);
  for (const m of page.messages) byId.set(m.id, m);
  const messages = [...byId.values()].filter(
    (m) =>
      !deleted.has(m.id) &&
      // An optimistic copy goes away once the real message arrived by polling.
      !(isTemp(m.id) && arrived.some((r) => r.author.id === m.author.id && r.body.trim() === m.body.trim())),
  );
  return { ...state, messages: messages.sort(byTime), serverTime: page.serverTime };
}

export function prependHistory(state: ChatState, page: ChatMessagesPage): ChatState {
  const ids = new Set(state.messages.map((m) => m.id));
  return {
    ...state,
    messages: [...page.messages.filter((m) => !ids.has(m.id)), ...state.messages],
    hasMore: page.hasMore,
  };
}

export function upsertMessage(state: ChatState, message: ChatMessage, replaceId?: string): ChatState {
  const rest = state.messages.filter((m) => m.id !== message.id && m.id !== replaceId);
  return { ...state, messages: [...rest, message].sort(byTime) };
}

// --- Composer ---------------------------------------------------------------------------------

/** The `@query` being typed right before the caret, if any. */
export function mentionQuery(text: string, caret: number) {
  const match = /(^|\s)@([^\s@[\]]{0,30})$/.exec(text.slice(0, caret));
  return match ? { query: match[2]!, start: caret - match[2]!.length - 1 } : undefined;
}

export const channelHref = (id: string) => `/home/chat/${id}`;
export const taskHref = (task: { id: string; listId: string }) => `/home/lists/${task.listId}/board?task=${task.id}`;

/** Message text without markup tokens: `@[Name](id)` becomes "@Name". */
export const plainText = (body: string) => body.replace(/@\[([^\]]{1,100})\]\(([0-9a-fA-F-]{36})\)/g, "@$1");
