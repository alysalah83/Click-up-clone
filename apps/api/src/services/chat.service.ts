import {
  chatMessageToTask,
  mentionedUserIds,
  resolvePlainMentions,
  type ChatMessageDto,
  type ChatMessagesQuery,
  type ChatTaskInput,
  type CreateChatChannelInput,
  type CreateChatMessageInput,
  type UpdateChatChannelInput,
} from "@clickup/shared";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, memberOf } from "./access.service.js";
import { assigneeUserSelect } from "./task.dto.js";
import { actorName, createNotifications } from "./notification.service.js";
import { createTask } from "./task.service.js";

/**
 * Chat channels per space, refreshed by polling (no WebSockets): clients ask for messages
 * `after` the newest one they have, plus messages changed `since` their last poll. Every change
 * to a message (edit, reaction, reply, delete) moves its `updatedAt`, which is what `since` reads.
 */

const PAGE = 50;
const MAX_BATCH = 200;
/** `since` looks back a little further, so a write committed during the previous poll is not missed. */
const SINCE_SLACK_MS = 2000;

const messageSelect = {
  id: true,
  channelId: true,
  parentId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  deletedAt: true,
  author: { select: assigneeUserSelect },
  reactions: { select: { emoji: true, userId: true }, orderBy: { createdAt: "asc" } },
  mentions: { select: { user: { select: { id: true, name: true } } } },
  task: { select: { id: true, name: true, listId: true } },
  _count: { select: { replies: { where: { deletedAt: null } } } },
  replies: { where: { deletedAt: null }, select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
} as const satisfies Prisma.ChatMessageSelect;

type Row = Prisma.ChatMessageGetPayload<{ select: typeof messageSelect }>;

/** `ChatMessageDto` before JSON serialization (dates are still Date objects). */
type Dto = Omit<ChatMessageDto, "createdAt" | "updatedAt" | "editedAt" | "lastReplyAt"> & {
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  lastReplyAt: Date | null;
};

function toDto({ reactions, mentions, _count, replies, deletedAt: _deletedAt, ...message }: Row): Dto {
  const groups = new Map<string, string[]>();
  for (const { emoji, userId } of reactions) groups.set(emoji, [...(groups.get(emoji) ?? []), userId]);
  return {
    ...message,
    reactions: [...groups].map(([emoji, userIds]) => ({ emoji, userIds })),
    mentions: mentions.map((m) => ({ userId: m.user.id, name: m.user.name })),
    replyCount: _count.replies,
    lastReplyAt: replies[0]?.createdAt ?? null,
  };
}

async function messageDto(id: string) {
  return toDto(await prisma.chatMessage.findUniqueOrThrow({ where: { id }, select: messageSelect }));
}

// --- Channels ---------------------------------------------------------------------------------

/** A channel in one of my spaces; a non-member gets the same 404 as a missing channel. */
async function accessibleChannel(userId: string, id: string) {
  const channel = await prisma.chatChannel.findFirst({
    where: { id, workspace: memberOf(userId) },
    select: { id: true, workspaceId: true, name: true },
  });
  if (!channel) throw new NotFoundError("Channel not found");
  return channel;
}

type ChannelSummaryRow = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  topic: string;
  unreadCount: number;
  lastMessageAt: Date | null;
};

/** Channels of one space, or of every space I belong to, with my unread count (top-level messages by others). */
export async function listChannels(userId: string, workspaceId?: string) {
  if (workspaceId) await assertCanAccess(userId, { workspaceId });
  return prisma.$queryRaw<ChannelSummaryRow[]>`
    SELECT c.id, c."workspaceId", w.name AS "workspaceName", c.name, c.topic,
      (count(m.id) FILTER (
        WHERE m."authorId" <> ${userId} AND (r."lastReadAt" IS NULL OR m."createdAt" > r."lastReadAt")
      ))::int AS "unreadCount",
      max(m."createdAt") AS "lastMessageAt"
    FROM "ChatChannel" c
    JOIN "Workspace" w ON w.id = c."workspaceId"
    JOIN "WorkspaceMember" wm ON wm."workspaceId" = c."workspaceId" AND wm."userId" = ${userId}
    LEFT JOIN "ChatChannelRead" r ON r."channelId" = c.id AND r."userId" = ${userId}
    LEFT JOIN "ChatMessage" m ON m."channelId" = c.id AND m."parentId" IS NULL AND m."deletedAt" IS NULL
    WHERE TRUE ${workspaceId ? Prisma.sql`AND c."workspaceId" = ${workspaceId}` : Prisma.empty}
    GROUP BY c.id, w.name, r."lastReadAt"
    ORDER BY c.name ASC`;
}

export async function getChannel(userId: string, id: string) {
  await accessibleChannel(userId, id);
  const channel = await prisma.chatChannel.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      workspaceId: true,
      name: true,
      topic: true,
      createdById: true,
      createdAt: true,
      workspace: {
        select: {
          name: true,
          members: { select: { user: { select: assigneeUserSelect } }, orderBy: { createdAt: "asc" } },
        },
      },
      reads: { where: { userId }, select: { lastReadAt: true } },
    },
  });
  const { workspace, reads, ...rest } = channel;
  return {
    ...rest,
    workspaceName: workspace.name,
    members: workspace.members.map((m) => m.user),
    viewerId: userId,
    lastReadAt: reads[0]?.lastReadAt ?? null,
  };
}

const channelSelect = { id: true, workspaceId: true, name: true, topic: true, createdById: true, createdAt: true };

async function assertNameFree(workspaceId: string, name: string, exceptId?: string) {
  const taken = await prisma.chatChannel.count({ where: { workspaceId, name, ...(exceptId && { NOT: { id: exceptId } }) } });
  if (taken) throw new ConflictError(`#${name} already exists in this space`);
}

export async function createChannel(userId: string, input: CreateChatChannelInput) {
  await assertCanAccess(userId, { workspaceId: input.workspaceId }, "member");
  await assertNameFree(input.workspaceId, input.name);
  const now = new Date();
  return prisma.chatChannel.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      topic: input.topic ?? "",
      createdById: userId,
      reads: { create: { userId, lastReadAt: now } },
    },
    select: channelSelect,
  });
}

export async function updateChannel(userId: string, id: string, input: UpdateChatChannelInput) {
  const { workspaceId } = await accessibleChannel(userId, id);
  await assertCanAccess(userId, { workspaceId }, "member");
  if (input.name) await assertNameFree(workspaceId, input.name, id);
  return prisma.chatChannel.update({ where: { id }, data: input, select: channelSelect });
}

export async function deleteChannel(userId: string, id: string) {
  const { workspaceId } = await accessibleChannel(userId, id);
  await assertCanAccess(userId, { workspaceId }, "member");
  await prisma.chatChannel.delete({ where: { id } });
  return { id };
}

export async function markRead(userId: string, id: string) {
  await accessibleChannel(userId, id);
  const lastReadAt = new Date();
  await prisma.chatChannelRead.upsert({
    where: { channelId_userId: { channelId: id, userId } },
    create: { channelId: id, userId, lastReadAt },
    update: { lastReadAt },
  });
  return { lastReadAt };
}

// --- Messages ---------------------------------------------------------------------------------

/** A cursor is a message id (exact position) or an ISO timestamp. */
async function cursorWhere(
  channelId: string,
  cursor: string,
  direction: "after" | "before",
): Promise<Prisma.ChatMessageWhereInput> {
  const cmp = <T,>(value: T) => (direction === "after" ? { gt: value } : { lt: value });
  if (!cursor.includes(":")) {
    const at = await prisma.chatMessage.findFirst({ where: { id: cursor, channelId }, select: { id: true, createdAt: true } });
    if (!at) throw new NotFoundError("Message not found");
    return { OR: [{ createdAt: cmp(at.createdAt) }, { createdAt: at.createdAt, id: cmp(at.id) }] };
  }
  return { createdAt: cmp(new Date(cursor)) };
}

/**
 * Top-level messages of a channel, oldest first: the latest page, history `before` a cursor, or
 * everything `after` one (polling). With `since`, also the messages changed since then.
 */
export async function listMessages(userId: string, channelId: string, query: ChatMessagesQuery) {
  await accessibleChannel(userId, channelId);
  const serverTime = new Date();
  const base = { channelId, parentId: null, deletedAt: null } satisfies Prisma.ChatMessageWhereInput;
  const limit = query.limit ?? PAGE;
  const asc = [{ createdAt: "asc" as const }, { id: "asc" as const }];
  const desc = [{ createdAt: "desc" as const }, { id: "desc" as const }];

  let rows: Row[];
  let hasMore = false;
  if (query.after) {
    rows = await prisma.chatMessage.findMany({
      where: { ...base, ...(await cursorWhere(channelId, query.after, "after")) },
      select: messageSelect,
      orderBy: asc,
      take: MAX_BATCH,
    });
  } else {
    const page = await prisma.chatMessage.findMany({
      where: { ...base, ...(query.before && (await cursorWhere(channelId, query.before, "before"))) },
      select: messageSelect,
      orderBy: desc,
      take: limit + 1,
    });
    hasMore = page.length > limit;
    rows = page.slice(0, limit).reverse();
  }

  let updated: Row[] = [];
  let deletedIds: string[] = [];
  if (query.since) {
    const changed = await prisma.chatMessage.findMany({
      where: {
        channelId,
        parentId: null,
        updatedAt: { gt: new Date(new Date(query.since).getTime() - SINCE_SLACK_MS) },
        id: { notIn: rows.map((r) => r.id) },
      },
      select: messageSelect,
      orderBy: asc,
      take: MAX_BATCH,
    });
    updated = changed.filter((m) => !m.deletedAt);
    deletedIds = changed.filter((m) => m.deletedAt).map((m) => m.id);
  }

  return { messages: rows.map(toDto), hasMore, updated: updated.map(toDto), deletedIds, serverTime };
}

/** Replies of a top-level message, oldest first. */
export async function listReplies(userId: string, messageId: string) {
  const parent = await accessibleMessage(userId, messageId);
  if (parent.parentId) throw new ValidationError("Replies belong to a top-level message");
  const rows = await prisma.chatMessage.findMany({
    where: { parentId: messageId, deletedAt: null },
    select: messageSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: MAX_BATCH,
  });
  return rows.map(toDto);
}

/** A live message in a channel I can read, with what the write paths need. */
async function accessibleMessage(userId: string, id: string) {
  const message = await prisma.chatMessage.findFirst({
    where: { id, deletedAt: null, channel: { workspace: memberOf(userId) } },
    select: {
      id: true,
      authorId: true,
      parentId: true,
      body: true,
      taskId: true,
      channel: { select: { id: true, name: true, workspaceId: true } },
    },
  });
  if (!message) throw new NotFoundError("Message not found");
  return message;
}

/** Resolves plain `@Name` mentions and returns the body with the ids of mentioned space members. */
async function withMentions(workspaceId: string, rawBody: string) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { user: { select: { id: true, name: true } } },
  });
  const body = resolvePlainMentions(
    rawBody,
    members.map((m) => m.user),
  );
  const memberIds = new Set(members.map((m) => m.user.id));
  return { body, mentioned: mentionedUserIds(body).filter((id) => memberIds.has(id)) };
}

async function notifyMentions(actorId: string, messageId: string, channelName: string, userIds: string[]) {
  if (userIds.length === 0) return;
  const actor = await actorName(actorId);
  await createNotifications(
    userIds.map((userId) => ({
      userId,
      actorId,
      type: "MENTIONED" as const,
      chatMessageId: messageId,
      message: `${actor} mentioned you in #${channelName}`,
    })),
  );
}

/** Moves a thread's parent `updatedAt`, so pollers see the new reply count. */
const touch = (id: string) => prisma.chatMessage.update({ where: { id }, data: { updatedAt: new Date() } });

export async function postMessage(userId: string, channelId: string, input: CreateChatMessageInput) {
  const channel = await accessibleChannel(userId, channelId);

  let parentId: string | null = null;
  if (input.parentId) {
    const parent = await prisma.chatMessage.findFirst({
      where: { id: input.parentId, channelId, deletedAt: null },
      select: { id: true, parentId: true },
    });
    if (!parent) throw new NotFoundError("Message not found");
    parentId = parent.parentId ?? parent.id;
  }

  const { body, mentioned } = await withMentions(channel.workspaceId, input.body);
  const created = await prisma.chatMessage.create({
    data: {
      channelId,
      authorId: userId,
      parentId,
      body,
      mentions: { createMany: { data: mentioned.map((id) => ({ userId: id })) } },
    },
    select: { id: true, createdAt: true },
  });
  if (parentId) await touch(parentId);
  else
    // Posting counts as reading: my own message never shows up as unread.
    await prisma.chatChannelRead.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId, lastReadAt: created.createdAt },
      update: { lastReadAt: created.createdAt },
    });
  await notifyMentions(userId, created.id, channel.name, mentioned);
  return messageDto(created.id);
}

export async function editMessage(userId: string, id: string, rawBody: string) {
  const message = await accessibleMessage(userId, id);
  if (message.authorId !== userId) throw new ForbiddenError("You can only edit your own messages");
  const { body, mentioned } = await withMentions(message.channel.workspaceId, rawBody);
  const before = new Set(mentionedUserIds(message.body));
  await prisma.$transaction([
    prisma.chatMention.deleteMany({ where: { messageId: id } }),
    prisma.chatMessage.update({
      where: { id },
      data: { body, editedAt: new Date(), mentions: { createMany: { data: mentioned.map((u) => ({ userId: u })) } } },
    }),
  ]);
  await notifyMentions(userId, id, message.channel.name, mentioned.filter((u) => !before.has(u)));
  return messageDto(id);
}

/** Soft delete, so pollers learn about it through `since`. */
export async function deleteMessage(userId: string, id: string) {
  const message = await accessibleMessage(userId, id);
  if (message.authorId !== userId) throw new ForbiddenError("You can only delete your own messages");
  await prisma.$transaction([
    prisma.chatMessage.update({ where: { id }, data: { body: "", deletedAt: new Date() } }),
    prisma.chatMention.deleteMany({ where: { messageId: id } }),
    prisma.chatReaction.deleteMany({ where: { messageId: id } }),
    prisma.notification.deleteMany({ where: { chatMessageId: id } }),
  ]);
  if (message.parentId) await touch(message.parentId);
  return { id };
}

/** Adds my reaction, or removes it when I already reacted with that emoji. */
export async function toggleReaction(userId: string, id: string, emoji: string) {
  await accessibleMessage(userId, id);
  const key = { messageId_userId_emoji: { messageId: id, userId, emoji } };
  const existing = await prisma.chatReaction.findUnique({ where: key });
  if (existing) await prisma.chatReaction.delete({ where: key });
  else await prisma.chatReaction.create({ data: { messageId: id, userId, emoji } });
  await touch(id);
  return messageDto(id);
}

/**
 * "Turn into task": creates a task in a list of the channel's space (default status), named after
 * the first line, described by the message and its source, and links it on the message.
 */
export async function createTaskFromMessage(userId: string, id: string, input: ChatTaskInput) {
  const message = await accessibleMessage(userId, id);
  if (message.taskId) throw new ConflictError("This message is already a task");
  const list = await prisma.list.findFirst({
    where: { id: input.listId, workspaceId: message.channel.workspaceId },
    select: { status: { select: { id: true }, orderBy: [{ isDefault: "desc" }, { order: "asc" }], take: 1 } },
  });
  if (!list) {
    const text = "List does not belong to this space";
    throw new ValidationError(text, { formErrors: [], fieldErrors: { listId: [text] } });
  }
  const statusId = list.status[0]?.id;
  if (!statusId) throw new NotFoundError("The list has no status");

  const { name, description } = chatMessageToTask(
    message.body,
    message.channel.name,
    await actorName(message.authorId),
  );
  const task = await createTask(
    userId,
    { listId: input.listId, statusId, name, priority: "none" },
    { description: description as Prisma.InputJsonObject },
  );
  await prisma.chatMessage.update({ where: { id }, data: { taskId: task.id } });
  return { task, message: await messageDto(id) };
}
