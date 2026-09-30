/** Mirrors `CommentDto` in packages/shared/src/collab.ts. */
export type CommentUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarColor: string | null;
};

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
  /** Only on top-level comments, oldest first. */
  replies: CommentDto[];
};
