/** Mirrors the chat DTOs in packages/shared/src/chat.ts. */
export type ChatUser = { id: string; name: string | null; email: string | null; avatarColor: string | null };

export type ChatChannelSummary = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  name: string;
  topic: string;
  unreadCount: number;
  lastMessageAt: string | null;
};

export type ChatChannel = {
  id: string;
  workspaceId: string;
  name: string;
  topic: string;
  createdById: string;
  createdAt: string;
  workspaceName: string;
  members: ChatUser[];
  viewerId: string;
  lastReadAt: string | null;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: ChatUser;
  reactions: { emoji: string; userIds: string[] }[];
  mentions: { userId: string; name: string | null }[];
  task: { id: string; name: string; listId: string } | null;
  replyCount: number;
  lastReplyAt: string | null;
  /** Client only: an optimistic message still being sent. */
  pending?: boolean;
};

export type ChatMessagesPage = {
  messages: ChatMessage[];
  hasMore: boolean;
  updated: ChatMessage[];
  deletedIds: string[];
  serverTime: string;
};

/** What the channel page keeps in the React Query cache. */
export type ChatState = { messages: ChatMessage[]; hasMore: boolean; serverTime: string };
