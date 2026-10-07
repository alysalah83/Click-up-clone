/** Mirrors the share link payloads in @clickup/shared (packages/shared/src/shareLink.ts). */

export type ShareResourceType = "list" | "doc";

export type ShareLinkDto = {
  id: string;
  token: string;
  resourceType: ShareResourceType;
  resourceId: string;
  isActive: boolean;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
};

/** GET /api/share-links/:type/:id */
export type ShareLinkState = { link: ShareLinkDto | null; canManage: boolean };

export type ShareTarget = { resourceType: ShareResourceType; resourceId: string };

/** Sanitized Tiptap JSON. */
export interface RichTextNode {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
  marks?: { type: string; attrs?: Record<string, string | null> }[];
  content?: RichTextNode[];
  text?: string;
}

export type PublicSharePerson = { name: string; avatarColor: string };

export type PublicShareStatus = {
  id: string;
  name: string;
  icon: string;
  /** Color token (the status' bgColor). */
  color: string;
  order: number;
  type: "open" | "active" | "done";
};

export type PublicShareTask = {
  id: string;
  name: string;
  statusId: string;
  priority: "urgent" | "high" | "normal" | "low" | "none";
  startDate: string | null;
  dueDate: string | null;
  points: number | null;
  assignees: PublicSharePerson[];
  tags: { name: string; color: string }[];
  subtaskCount: number;
  subtaskDoneCount: number;
};

export type PublicShareList = {
  resourceType: "list";
  name: string;
  spaceName: string;
  statuses: PublicShareStatus[];
  tasks: PublicShareTask[];
};

export type PublicShareTaskDetail = PublicShareTask & {
  description: RichTextNode | null;
  subtasks: Pick<PublicShareTask, "id" | "name" | "statusId" | "priority" | "dueDate" | "assignees">[];
};

export type PublicSharePageSummary = { id: string; parentId: string | null; title: string; icon: string | null };

export type PublicSharePage = PublicSharePageSummary & {
  content: RichTextNode | null;
  updatedAt: string;
  authorName: string | null;
};

export type PublicShareDoc = PublicSharePage & {
  resourceType: "doc";
  spaceName: string;
  pages: PublicSharePageSummary[];
};

export type PublicShare = PublicShareList | PublicShareDoc;
