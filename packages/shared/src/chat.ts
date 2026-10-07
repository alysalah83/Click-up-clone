import { z } from "zod";
import { idSchema } from "./common.js";
import { COMMENT_MENTION_REGEX, type CommentReactionGroup, type CommentUser } from "./collab.js";

// --- Channels ---------------------------------------------------------------------------------

/** "Product Updates!" -> "product-updates": lowercase, dashes, no "#". */
export function normalizeChannelName(name: string) {
  return name
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export const chatChannelNameSchema = z
  .string()
  .max(80)
  .transform(normalizeChannelName)
  .pipe(z.string().min(1, "Use letters or numbers in the channel name"));
const topicSchema = z.string().trim().max(250);

export const createChatChannelSchema = z.object({
  workspaceId: idSchema,
  name: chatChannelNameSchema,
  topic: topicSchema.optional(),
});
export const updateChatChannelSchema = z.object({
  name: chatChannelNameSchema.optional(),
  topic: topicSchema.optional(),
});
export const chatChannelsQuerySchema = z.object({ workspaceId: idSchema.optional() });

// --- Messages ---------------------------------------------------------------------------------

export const CHAT_MESSAGE_MAX = 4000;
const bodySchema = z.string().trim().min(1).max(CHAT_MESSAGE_MAX);

export const createChatMessageSchema = z.object({
  body: bodySchema,
  /** Reply in the thread of a top-level message of the same channel. */
  parentId: idSchema.optional(),
});
export const updateChatMessageSchema = z.object({ body: bodySchema });

/** A message id or an ISO timestamp. */
const cursorSchema = z.union([idSchema, z.iso.datetime({ offset: true })]);
export const chatMessagesQuerySchema = z.object({
  /** Messages newer than this cursor (polling). */
  after: cursorSchema.optional(),
  /** Messages older than this cursor (loading history). */
  before: cursorSchema.optional(),
  /** Also return messages changed (edited, reacted, replied, deleted) since this time. */
  since: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export const chatTaskSchema = z.object({ listId: idSchema });

export type CreateChatChannelInput = z.infer<typeof createChatChannelSchema>;
export type UpdateChatChannelInput = z.infer<typeof updateChatChannelSchema>;
export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>;
export type ChatMessagesQuery = z.infer<typeof chatMessagesQuerySchema>;
export type ChatTaskInput = z.infer<typeof chatTaskSchema>;

export type ChatChannelSummaryDto = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  topic: string;
  unreadCount: number;
  lastMessageAt: string | null;
};
export type ChatChannelDto = Omit<ChatChannelSummaryDto, "unreadCount" | "lastMessageAt"> & {
  createdById: string;
  createdAt: string;
  members: CommentUser[];
  /** The caller: highlights their mentions and allows editing their own messages. */
  viewerId: string;
  /** The caller's read marker before opening (null = never opened). */
  lastReadAt: string | null;
};
export type ChatMessageDto = {
  id: string;
  channelId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: CommentUser;
  reactions: CommentReactionGroup[];
  mentions: { userId: string; name: string | null }[];
  task: { id: string; name: string; listId: string } | null;
  replyCount: number;
  lastReplyAt: string | null;
};
export type ChatMessagesPageDto = {
  /** Oldest first. */
  messages: ChatMessageDto[];
  /** More history before the first message (latest page and `before` only). */
  hasMore: boolean;
  /** With `since`: messages changed since then, and ids deleted since then. */
  updated: ChatMessageDto[];
  deletedIds: string[];
  /** Pass back as `since` on the next poll. */
  serverTime: string;
};

// --- Mentions ---------------------------------------------------------------------------------

export function mentionedUserIds(body: string) {
  return [...new Set([...body.matchAll(COMMENT_MENTION_REGEX)].map((m) => m[2]!.toLowerCase()))];
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Turns plain `@Full Name` or `@FirstName` (when only one member has that first name) into
 * `@[Full Name](userId)` tokens, so a typed mention works like a picked one. Existing tokens
 * stay as they are. Longer names win ("@Maya Chen" before "@Maya").
 */
export function resolvePlainMentions(body: string, members: { id: string; name: string | null }[]) {
  const named = members.filter((m): m is { id: string; name: string } => !!m.name?.trim());
  const firstNameCount = new Map<string, number>();
  for (const m of named) {
    const first = m.name.trim().split(/\s+/)[0]!.toLowerCase();
    firstNameCount.set(first, (firstNameCount.get(first) ?? 0) + 1);
  }
  const aliases: { alias: string; id: string; name: string }[] = [];
  for (const m of named) {
    const full = m.name.trim();
    aliases.push({ alias: full, id: m.id, name: full });
    const first = full.split(/\s+/)[0]!;
    if (first !== full && firstNameCount.get(first.toLowerCase()) === 1) aliases.push({ alias: first, id: m.id, name: full });
  }
  if (aliases.length === 0) return body;
  aliases.sort((a, b) => b.alias.length - a.alias.length);
  const pattern = new RegExp(
    `(@\\[[^\\]]{1,100}\\]\\([0-9a-fA-F-]{36}\\))|(^|[\\s(])@(${aliases.map((a) => escapeRegex(a.alias)).join("|")})(?![\\w-])`,
    "gi",
  );
  return body.replace(pattern, (match, token: string | undefined, lead: string, alias: string) => {
    if (token) return match;
    const hit = aliases.find((a) => a.alias.toLowerCase() === alias.toLowerCase())!;
    return `${lead}@[${hit.name.replace(/[[\]]/g, "")}](${hit.id})`;
  });
}

/** Message text for places that do not render chat markup: mention tokens become "@Name". */
export function chatPlainText(body: string) {
  return body.replace(COMMENT_MENTION_REGEX, (_m, name: string) => `@${name}`);
}

// --- Turn into task ---------------------------------------------------------------------------

type TiptapNode = { type: string; text?: string; content?: TiptapNode[]; marks?: { type: string }[] };

/**
 * Task name and Tiptap description for a message turned into a task: the name is the first
 * non-empty line (markup stripped, max 128 chars), the description the whole message followed by
 * "From #channel by Author".
 */
export function chatMessageToTask(body: string, channelName: string, authorName: string) {
  const plain = chatPlainText(body)
    .replace(/```/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
  const lines = plain.split(/\r?\n/);
  const firstLine = lines.map((l) => l.trim()).find(Boolean) ?? "Chat message";
  const name = firstLine.length > 128 ? `${firstLine.slice(0, 127).trimEnd()}…` : firstLine;
  const paragraphs: TiptapNode[] = lines.map((line) =>
    line.trim() ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" },
  );
  paragraphs.push({
    type: "paragraph",
    content: [{ type: "text", text: `From #${channelName} by ${authorName}`, marks: [{ type: "italic" }] }],
  });
  return { name, description: { type: "doc", content: paragraphs } };
}
