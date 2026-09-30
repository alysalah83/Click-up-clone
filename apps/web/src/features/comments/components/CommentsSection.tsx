"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/features/members/components/UserAvatar";
import { displayName } from "@/features/members/lib/avatar";
import { usePeople } from "@/features/members/hooks/useMembers";
import SectionHeader from "@/features/taskDetail/components/SectionHeader";
import { ICONS_MAP } from "@/shared/icons/icons-map";
import { cn } from "@/shared/lib/utils/cn";
import { useComments, useDeleteComment, useToggleReaction } from "../hooks/useComments";
import type { CommentDto } from "../types";
import CommentBody from "./CommentBody";
import CommentComposer from "./CommentComposer";

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "😄", "👀", "🚀"];

interface CommentItemProps {
  comment: CommentDto;
  taskId: string;
  listId: string;
  myId: string | undefined;
  /** Top-level comment id replies attach to. */
  threadId: string;
  isReply?: boolean;
}

function CommentItem({ comment, taskId, listId, myId, threadId, isReply }: CommentItemProps) {
  const [replying, setReplying] = useState(false);
  const [picking, setPicking] = useState(false);
  const toggleReaction = useToggleReaction(taskId);
  const deleteComment = useDeleteComment(taskId);
  const react = (emoji: string) => {
    setPicking(false);
    toggleReaction.mutate({ commentId: comment.id, emoji });
  };

  return (
    <li className="flex gap-2.5">
      <UserAvatar user={comment.author} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-xs text-neutral-500">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {displayName(comment.author)}
          </span>
          <time dateTime={comment.createdAt}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </time>
        </div>
        <CommentBody body={comment.body} />

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {comment.reactions.map((r) => {
            const mine = !!myId && r.userIds.includes(myId);
            return (
              <button
                key={r.emoji}
                type="button"
                aria-pressed={mine}
                onClick={() => react(r.emoji)}
                className={cn(
                  "flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                  mine
                    ? "border-violet-500 bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    : "border-neutral-200 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
                )}
              >
                <span>{r.emoji}</span>
                <span className="tabular-nums">{r.userIds.length}</span>
              </button>
            );
          })}
          <div className="relative">
            <button
              type="button"
              aria-label="add reaction"
              aria-expanded={picking}
              onClick={() => setPicking((p) => !p)}
              className="cursor-pointer rounded-full border border-transparent px-2 py-0.5 text-xs text-neutral-500 hover:border-neutral-200 hover:bg-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
            >
              ☺ +
            </button>
            {picking && (
              <div className="absolute top-full left-0 z-10 mt-1 flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => react(emoji)}
                    className="cursor-pointer rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setReplying((r) => !r)}
            className="cursor-pointer rounded px-2 py-0.5 text-xs text-neutral-500 hover:text-violet-600 dark:hover:text-violet-300"
          >
            Reply
          </button>
          {comment.author.id === myId && (
            <button
              type="button"
              aria-label="delete comment"
              disabled={deleteComment.isPending}
              onClick={() => deleteComment.mutate(comment.id)}
              className="cursor-pointer rounded p-1 text-neutral-400 hover:text-red-500"
            >
              <ICONS_MAP.trash className="size-3.5" />
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2">
            <CommentComposer
              taskId={taskId}
              listId={listId}
              parentId={threadId}
              placeholder={`Reply to ${displayName(comment.author)}…`}
              autoFocus
              onDone={() => setReplying(false)}
            />
          </div>
        )}

        {!isReply && comment.replies.length > 0 && (
          <ul className="mt-3 flex flex-col gap-3 border-l-2 border-neutral-200 pl-3 dark:border-neutral-700">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                taskId={taskId}
                listId={listId}
                myId={myId}
                threadId={comment.id}
                isReply
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function CommentsSection({ taskId, listId }: { taskId: string; listId: string }) {
  const { comments, isPending, error } = useComments(taskId);
  const { people } = usePeople();
  const myId = people?.find((p) => p.isMe)?.id;
  const total = comments?.reduce((n, c) => n + 1 + c.replies.length, 0) ?? 0;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Comments" count={total > 0 ? String(total) : undefined} />
      {isPending && <p className="text-sm text-neutral-500">Loading comments…</p>}
      {error && <p className="text-sm text-red-500">Could not load comments.</p>}
      {comments && comments.length > 0 && (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              listId={listId}
              myId={myId}
              threadId={comment.id}
            />
          ))}
        </ul>
      )}
      <CommentComposer taskId={taskId} listId={listId} />
    </section>
  );
}

export default CommentsSection;
