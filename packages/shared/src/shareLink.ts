import { z } from "zod";
import { idSchema } from "./common.js";

/** Public read-only share links for a list or a doc (/share/<token>). */

export const SHARE_RESOURCE_TYPES = ["list", "doc"] as const;
export const shareResourceTypeSchema = z.enum(SHARE_RESOURCE_TYPES);
export type ShareResourceType = z.infer<typeof shareResourceTypeSchema>;

export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22,64}$/, "Invalid share link");

export const shareResourceParamsSchema = z.object({ resourceType: shareResourceTypeSchema, resourceId: idSchema });
export const updateShareLinkSchema = z.object({ isActive: z.boolean() });
export type UpdateShareLinkInput = z.infer<typeof updateShareLinkSchema>;

export const shareTokenParamsSchema = z.object({ token: shareTokenSchema });
export const shareTaskParamsSchema = z.object({ token: shareTokenSchema, taskId: idSchema });
export const sharePageParamsSchema = z.object({ token: shareTokenSchema, docId: idSchema });

// --- Rich text sanitizing -------------------------------------------------------------------

/** A Tiptap (ProseMirror) JSON node, restricted to what the editors in the app produce. */
export interface RichTextNode {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
  marks?: { type: string; attrs?: Record<string, string | null> }[];
  content?: RichTextNode[];
  text?: string;
}

/** Node types and the attributes each one may keep. Anything else is dropped. */
const NODE_ATTRS: Record<string, readonly string[]> = {
  doc: [],
  paragraph: [],
  text: [],
  heading: ["level"],
  bulletList: [],
  orderedList: ["start"],
  listItem: [],
  taskList: [],
  taskItem: ["checked"],
  codeBlock: ["language"],
  blockquote: [],
  horizontalRule: [],
  hardBreak: [],
};
const MARKS = new Set(["bold", "italic", "strike", "code", "underline", "link"]);
const MAX_DEPTH = 40;
const SAFE_HREF = /^(https?:|mailto:)/i;

function sanitizeAttrs(type: string, attrs: unknown): RichTextNode["attrs"] | undefined {
  if (!attrs || typeof attrs !== "object") return undefined;
  const out: NonNullable<RichTextNode["attrs"]> = {};
  const source = attrs as Record<string, unknown>;
  for (const key of NODE_ATTRS[type] ?? []) {
    const value = source[key];
    if (key === "level" && typeof value === "number") out.level = Math.min(6, Math.max(1, Math.trunc(value)));
    else if (key === "start" && typeof value === "number") out.start = Math.max(0, Math.trunc(value));
    else if (key === "checked" && typeof value === "boolean") out.checked = value;
    else if (key === "language" && typeof value === "string" && /^[\w+#-]{1,30}$/.test(value)) out.language = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function sanitizeMarks(marks: unknown): RichTextNode["marks"] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: NonNullable<RichTextNode["marks"]> = [];
  for (const mark of marks) {
    const type = (mark as { type?: unknown })?.type;
    if (typeof type !== "string" || !MARKS.has(type)) continue;
    if (type === "link") {
      const href = (mark as { attrs?: { href?: unknown } }).attrs?.href;
      // A link with an unsafe or missing href keeps its text but loses the link.
      if (typeof href !== "string" || !SAFE_HREF.test(href.trim())) continue;
      out.push({ type, attrs: { href: href.trim().slice(0, 2000) } });
    } else out.push({ type });
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeNode(node: unknown, depth: number): RichTextNode | null {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH) return null;
  const { type, text, attrs, marks, content } = node as Record<string, unknown>;
  if (typeof type !== "string" || !(type in NODE_ATTRS)) return null;
  if (type === "text") {
    if (typeof text !== "string" || text.length === 0) return null;
    const cleanMarks = sanitizeMarks(marks);
    return { type, text, ...(cleanMarks && { marks: cleanMarks }) };
  }
  const out: RichTextNode = { type };
  const cleanAttrs = sanitizeAttrs(type, attrs);
  if (cleanAttrs) out.attrs = cleanAttrs;
  if (Array.isArray(content)) {
    const children = content.map((child) => sanitizeNode(child, depth + 1)).filter((c): c is RichTextNode => !!c);
    if (children.length > 0) out.content = children;
  }
  return out;
}

/**
 * Keeps only the node types, attributes and marks the app's editors produce (no raw HTML, no
 * unsafe link protocols), so stored rich text can be shown to the public. Accepts the parsed JSON
 * or its serialized string (docs store a string). Returns null for empty or unreadable content.
 */
export function sanitizeRichText(value: unknown): RichTextNode | null {
  let parsed = value;
  if (typeof value === "string") {
    if (!value.trim()) return null;
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const root = sanitizeNode(parsed, 0);
  if (!root || root.type !== "doc" || !root.content?.length) return null;
  return root;
}

// --- Payloads -------------------------------------------------------------------------------

/** What the Share popover shows (members only). */
export interface ShareLinkDto {
  id: string;
  token: string;
  resourceType: ShareResourceType;
  resourceId: string;
  isActive: boolean;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
}

export interface PublicSharePerson {
  name: string;
  avatarColor: string;
}

export interface PublicShareStatus {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  type: "open" | "active" | "done";
}

export interface PublicShareTask {
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
}

export interface PublicShareList {
  resourceType: "list";
  name: string;
  spaceName: string;
  statuses: PublicShareStatus[];
  tasks: PublicShareTask[];
}

export interface PublicShareTaskDetail extends PublicShareTask {
  description: RichTextNode | null;
  subtasks: Pick<PublicShareTask, "id" | "name" | "statusId" | "priority" | "dueDate" | "assignees">[];
}

export interface PublicSharePageSummary {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
}

export interface PublicSharePage extends PublicSharePageSummary {
  content: RichTextNode | null;
  updatedAt: string;
  /** Null when the author has no display name (e.g. a guest). */
  authorName: string | null;
}

export interface PublicShareDoc extends PublicSharePage {
  resourceType: "doc";
  spaceName: string;
  /** Every page below the shared doc (parentId links them into a tree rooted at `id`). */
  pages: PublicSharePageSummary[];
}

export type PublicShare = PublicShareList | PublicShareDoc;
