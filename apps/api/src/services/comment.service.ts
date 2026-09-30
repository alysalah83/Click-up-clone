import { COMMENT_MENTION_REGEX, type CommentDto, type CreateCommentInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess } from "./access.service.js";
import { assigneeUserSelect } from "./task.dto.js";
import { actorName, createNotifications, taskFollowers } from "./notification.service.js";

const commentSelect = {
  id: true,
  taskId: true,
  parentId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: assigneeUserSelect },
  reactions: { select: { emoji: true, userId: true }, orderBy: { createdAt: "asc" } },
  mentions: { select: { user: { select: { id: true, name: true } } } },
} as const;

type Row = Awaited<ReturnType<typeof findRows>>[number];

const findRows = (where: { taskId?: string; id?: string }) =>
  prisma.comment.findMany({ where, select: commentSelect, orderBy: { createdAt: "asc" } });

/** `CommentDto` before JSON serialization (dates are still Date objects). */
type Dto = Omit<CommentDto, "createdAt" | "updatedAt" | "replies"> & {
  createdAt: Date;
  updatedAt: Date;
  replies: Dto[];
};

function toDto({ reactions, mentions, ...comment }: Row): Dto {
  const groups = new Map<string, string[]>();
  for (const { emoji, userId } of reactions) groups.set(emoji, [...(groups.get(emoji) ?? []), userId]);
  return {
    ...comment,
    reactions: [...groups].map(([emoji, userIds]) => ({ emoji, userIds })),
    mentions: mentions.map((m) => ({ userId: m.user.id, name: m.user.name })),
    replies: [],
  };
}

/** Top-level comments oldest first, each with its replies. */
export async function listComments(userId: string, taskId: string) {
  await assertCanAccess(userId, { taskId });
  const dtos = (await findRows({ taskId })).map(toDto);
  const byId = new Map(dtos.map((d) => [d.id, d]));
  const top: typeof dtos = [];
  for (const dto of dtos) {
    const parent = dto.parentId ? byId.get(dto.parentId) : undefined;
    if (parent) parent.replies.push(dto);
    else top.push(dto);
  }
  return top;
}

function mentionedIds(body: string) {
  return [...new Set([...body.matchAll(COMMENT_MENTION_REGEX)].map((m) => m[2]!.toLowerCase()))];
}

export async function createComment(userId: string, taskId: string, { body, parentId }: CreateCommentInput) {
  const { workspaceId } = await assertCanAccess(userId, { taskId });

  let rootId: string | null = null;
  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentId, taskId },
      select: { id: true, parentId: true },
    });
    if (!parent) throw new NotFoundError("Comment not found");
    rootId = parent.parentId ?? parent.id;
  }

  // Only workspace members can be mentioned.
  const mentioned = (
    await prisma.workspaceMember.findMany({
      where: { workspaceId, userId: { in: mentionedIds(body) } },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  const followers = await taskFollowers(taskId);
  const created = await prisma.comment.create({
    data: {
      taskId,
      authorId: userId,
      parentId: rootId,
      body,
      mentions: { createMany: { data: mentioned.map((id) => ({ userId: id })) } },
    },
    select: { id: true },
  });

  const [actor, task] = await Promise.all([
    actorName(userId),
    prisma.task.findUniqueOrThrow({ where: { id: taskId }, select: { id: true, name: true } }),
  ]);
  const base = { actorId: userId, taskId, commentId: created.id };
  await createNotifications([
    ...mentioned.map((id) => ({
      ...base,
      userId: id,
      type: "MENTIONED" as const,
      message: `${actor} mentioned you in "${task.name}"`,
    })),
    ...followers
      .filter((id) => !mentioned.includes(id))
      .map((id) => ({
        ...base,
        userId: id,
        type: "COMMENTED" as const,
        message: `${actor} commented on "${task.name}"`,
      })),
  ]);

  const [row] = await findRows({ id: created.id });
  return toDto(row!);
}

export async function deleteComment(userId: string, id: string) {
  const comment = await prisma.comment.findUnique({ where: { id }, select: { authorId: true, taskId: true } });
  if (!comment) throw new NotFoundError("Comment not found");
  await assertCanAccess(userId, { taskId: comment.taskId });
  if (comment.authorId !== userId) throw new ForbiddenError("You can only delete your own comments");
  await prisma.comment.delete({ where: { id } });
}

/** Adds the user's reaction, or removes it when they already reacted with that emoji. */
export async function toggleReaction(userId: string, id: string, emoji: string) {
  const comment = await prisma.comment.findUnique({ where: { id }, select: { taskId: true } });
  if (!comment) throw new NotFoundError("Comment not found");
  await assertCanAccess(userId, { taskId: comment.taskId });
  const key = { commentId_userId_emoji: { commentId: id, userId, emoji } };
  const existing = await prisma.commentReaction.findUnique({ where: key });
  if (existing) await prisma.commentReaction.delete({ where: key });
  else await prisma.commentReaction.create({ data: { commentId: id, userId, emoji } });
  const [row] = await findRows({ id });
  return toDto(row!);
}
