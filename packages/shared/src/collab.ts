import { z } from "zod";
import { idSchema } from "./common.js";

// --- Comments ---------------------------------------------------------------------------------

/** Mentions are stored inline in the body as `@[Display Name](userId)`. */
export const COMMENT_MENTION_REGEX = /@\[([^\]]{1,100})\]\(([0-9a-fA-F-]{36})\)/g;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  /** Reply to a comment on the same task (replies to replies attach to the top-level comment). */
  parentId: idSchema.optional(),
});
export const toggleReactionSchema = z.object({ emoji: z.string().trim().min(1).max(16) });

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;

export type CommentUser = { id: string; name: string | null; email: string | null; avatarColor: string | null };
export type CommentReactionGroup = { emoji: string; userIds: string[] };
export type CommentDto = {
  id: string;
  taskId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: CommentUser;
  reactions: CommentReactionGroup[];
  mentions: { userId: string; name: string | null }[];
  /** Only on top-level comments, oldest first. Empty on replies. */
  replies: CommentDto[];
};

// --- Notifications ----------------------------------------------------------------------------

export const NOTIFICATION_TYPES = ["ASSIGNED", "MENTIONED", "TASK_UPDATED", "COMMENTED"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationDto = {
  id: string;
  type: NotificationType;
  message: string;
  taskId: string;
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: CommentUser;
  task: { id: string; name: string; listId: string };
};
export type UnreadCountDto = { count: number };

// --- My Work ----------------------------------------------------------------------------------

export const myWorkQuerySchema = z.object({
  /** The client's UTC offset in minutes, east positive (e.g. 120 for UTC+2). Defaults to 0. */
  tz: z.coerce.number().int().min(-840).max(840).optional(),
});

export const MY_WORK_BUCKETS = ["overdue", "today", "upcoming", "nodate"] as const;
export type MyWorkBucket = (typeof MY_WORK_BUCKETS)[number];

export type MyWorkTaskDto = {
  id: string;
  name: string;
  priority: "urgent" | "high" | "normal" | "low" | "none";
  startDate: string | null;
  /** The due date. */
  dueDate: string | null;
  bucket: MyWorkBucket;
  status: { id: string; name: string; type: "open" | "active" | "done"; icon: string; iconColor: string; bgColor: string };
  list: { id: string; name: string; workspaceId: string; workspaceName: string };
};

// --- Search -----------------------------------------------------------------------------------

export const searchQuerySchema = z.object({ q: z.string().trim().min(1).max(100) });

export type SearchResultDto = {
  tasks: { id: string; name: string; listId: string; status: { id: string; name: string; type: "open" | "active" | "done" } }[];
  lists: { id: string; name: string; workspaceId: string }[];
  members: { id: string; name: string | null; email: string | null; avatarColor: string | null }[];
};

// --- AI ---------------------------------------------------------------------------------------

export type AiSummaryDto = { summary: string };
export type AiSubtaskSuggestionsDto = { subtasks: string[] };
