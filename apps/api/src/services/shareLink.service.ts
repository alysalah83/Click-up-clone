import { randomBytes } from "node:crypto";
import {
  sanitizeRichText,
  type PublicShare,
  type PublicSharePage,
  type PublicSharePerson,
  type PublicShareTask,
  type PublicShareTaskDetail,
  type ShareLinkDto,
  type ShareResourceType,
} from "@clickup/shared";
import type { MemberRole, Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess, hasRole } from "./access.service.js";

/** 16 random bytes as base64url: a 22-character unguessable link token. */
export const newShareToken = () => randomBytes(16).toString("base64url");

const NOT_ACTIVE = "This link is no longer active";
/** The public list page shows at most this many top-level tasks. */
const MAX_PUBLIC_TASKS = 500;

const linkSelect = {
  id: true,
  token: true,
  resourceType: true,
  listId: true,
  docId: true,
  isActive: true,
  viewCount: true,
  lastViewedAt: true,
  createdAt: true,
} satisfies Prisma.ShareLinkSelect;
type LinkRow = Prisma.ShareLinkGetPayload<{ select: typeof linkSelect }>;

const toDto = (row: LinkRow): ShareLinkDto => ({
  id: row.id,
  token: row.token,
  resourceType: row.resourceType,
  resourceId: (row.listId ?? row.docId)!,
  isActive: row.isActive,
  viewCount: row.viewCount,
  lastViewedAt: row.lastViewedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
});

const resourceKey = (type: ShareResourceType, resourceId: string) =>
  type === "list" ? { listId: resourceId } : { docId: resourceId };

/** The list or doc's space, with a membership check (non-members get the same 404 as missing). */
async function resourceWorkspace(userId: string, type: ShareResourceType, resourceId: string, minRole?: MemberRole) {
  const row =
    type === "list"
      ? await prisma.list.findUnique({ where: { id: resourceId }, select: { workspaceId: true } })
      : await prisma.doc.findUnique({ where: { id: resourceId }, select: { workspaceId: true } });
  if (!row) throw new NotFoundError(type === "list" ? "List not found" : "Doc not found");
  const { role } = await assertCanAccess(userId, { workspaceId: row.workspaceId }, minRole);
  return { workspaceId: row.workspaceId, role };
}

/**
 * The resource's link (null when it was never shared) and whether the caller may change it.
 * Anyone in the space can look; members and above can change it.
 */
export async function getShareLink(userId: string, type: ShareResourceType, resourceId: string) {
  const { role } = await resourceWorkspace(userId, type, resourceId);
  const row = await prisma.shareLink.findUnique({
    where: resourceKey(type, resourceId) as Prisma.ShareLinkWhereUniqueInput,
    select: linkSelect,
  });
  return { link: row ? toDto(row) : null, canManage: hasRole(role, "member") };
}

/** Turns the public link on or off (members and above). Turning it back on keeps the same URL. */
export async function setShareLinkActive(userId: string, type: ShareResourceType, resourceId: string, isActive: boolean) {
  const { workspaceId } = await resourceWorkspace(userId, type, resourceId, "member");
  const key = resourceKey(type, resourceId);
  const row = await prisma.shareLink.upsert({
    where: key as Prisma.ShareLinkWhereUniqueInput,
    update: { isActive },
    create: { ...key, resourceType: type, workspaceId, createdById: userId, token: newShareToken(), isActive },
    select: linkSelect,
  });
  return toDto(row);
}

/** Revokes the current URL and issues a new one (active, views back to zero). */
export async function resetShareLink(userId: string, type: ShareResourceType, resourceId: string) {
  const { workspaceId } = await resourceWorkspace(userId, type, resourceId, "member");
  const key = resourceKey(type, resourceId);
  const token = newShareToken();
  const row = await prisma.shareLink.upsert({
    where: key as Prisma.ShareLinkWhereUniqueInput,
    update: { token, isActive: true, viewCount: 0, lastViewedAt: null },
    create: { ...key, resourceType: type, workspaceId, createdById: userId, token },
    select: linkSelect,
  });
  return toDto(row);
}

// --- Public ---------------------------------------------------------------------------------

async function activeLink(token: string) {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    select: { id: true, isActive: true, resourceType: true, listId: true, docId: true },
  });
  // Turned off, reset and unknown links all look the same.
  if (!link || !link.isActive) throw new NotFoundError(NOT_ACTIVE);
  return link;
}

const FALLBACK_AVATAR_COLORS = ["#7b68ee", "#0092b8", "#e17100", "#008236", "#e7000b", "#4f39f6", "#c800de", "#009689"];

/** Display name and avatar color only (no email or id), matching the app's avatar fallback. */
function person(user: { id: string; name: string | null; avatarColor: string | null }): PublicSharePerson {
  let color = user.avatarColor;
  if (!color) {
    let hash = 0;
    for (const char of user.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    color = FALLBACK_AVATAR_COLORS[hash % FALLBACK_AVATAR_COLORS.length]!;
  }
  return { name: user.name?.trim() || "Guest", avatarColor: color };
}

const personSelect = { id: true, name: true, avatarColor: true } as const;
const taskSelect = {
  id: true,
  name: true,
  statusId: true,
  priority: true,
  startDate: true,
  endDate: true,
  points: true,
  assignees: { select: { user: { select: personSelect } }, orderBy: { createdAt: "asc" } },
  tags: { select: { tag: { select: { name: true, color: true } } } },
  subtasks: { select: { status: { select: { type: true } } } },
} satisfies Prisma.TaskSelect;
type TaskRow = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

const toPublicTask = (t: TaskRow): PublicShareTask => ({
  id: t.id,
  name: t.name,
  statusId: t.statusId,
  priority: t.priority,
  startDate: t.startDate?.toISOString() ?? null,
  dueDate: t.endDate?.toISOString() ?? null,
  points: t.points,
  assignees: t.assignees.map((a) => person(a.user)),
  tags: t.tags.map((x) => x.tag),
  subtaskCount: t.subtasks.length,
  subtaskDoneCount: t.subtasks.filter((s) => s.status.type === "done").length,
});

/** Ids of the pages below `rootId`, from a space's (id, parentId) pairs. */
export function descendantPageIds(rootId: string, pages: { id: string; parentId: string | null }[]): Set<string> {
  const children = new Map<string, string[]>();
  for (const p of pages) if (p.parentId) children.set(p.parentId, [...(children.get(p.parentId) ?? []), p.id]);
  const found = new Set<string>();
  const queue = [...(children.get(rootId) ?? [])];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (found.has(id) || id === rootId) continue;
    found.add(id);
    queue.push(...(children.get(id) ?? []));
  }
  return found;
}

const pageSelect = {
  id: true,
  parentId: true,
  title: true,
  icon: true,
  content: true,
  updatedAt: true,
  createdBy: { select: { name: true } },
} satisfies Prisma.DocSelect;

const toPublicPage = (d: Prisma.DocGetPayload<{ select: typeof pageSelect }>, isRoot = false): PublicSharePage => ({
  id: d.id,
  // The shared doc is the root of the public tree: its own parent stays private.
  parentId: isRoot ? null : d.parentId,
  title: d.title,
  icon: d.icon,
  content: sanitizeRichText(d.content),
  updatedAt: d.updatedAt.toISOString(),
  authorName: d.createdBy.name?.trim() || null,
});

/** The shared list or doc, read-only and stripped of private data. Counts a view. */
export async function getPublicShare(token: string, now = new Date()): Promise<PublicShare> {
  const link = await activeLink(token);
  await prisma.shareLink.update({
    where: { id: link.id },
    data: { viewCount: { increment: 1 }, lastViewedAt: now },
  });

  if (link.resourceType === "list") {
    const list = await prisma.list.findUnique({
      where: { id: link.listId! },
      select: {
        name: true,
        workspace: { select: { name: true } },
        status: { select: { id: true, name: true, icon: true, bgColor: true, order: true, type: true }, orderBy: { order: "asc" } },
      },
    });
    if (!list) throw new NotFoundError(NOT_ACTIVE);
    const tasks = await prisma.task.findMany({
      where: { listId: link.listId!, parentTaskId: null },
      select: taskSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: MAX_PUBLIC_TASKS,
    });
    return {
      resourceType: "list",
      name: list.name,
      spaceName: list.workspace.name,
      statuses: list.status.map((s) => ({ id: s.id, name: s.name, icon: s.icon, color: s.bgColor, order: s.order, type: s.type })),
      tasks: tasks.map(toPublicTask),
    };
  }

  const doc = await prisma.doc.findUnique({
    where: { id: link.docId! },
    select: { ...pageSelect, workspaceId: true, workspace: { select: { name: true } } },
  });
  if (!doc) throw new NotFoundError(NOT_ACTIVE);
  const spacePages = await prisma.doc.findMany({
    where: { workspaceId: doc.workspaceId },
    select: { id: true, parentId: true, title: true, icon: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const below = descendantPageIds(doc.id, spacePages);
  return {
    resourceType: "doc",
    ...toPublicPage(doc, true),
    spaceName: doc.workspace.name,
    pages: spacePages.filter((p) => below.has(p.id)),
  };
}

/** One task of a shared list (or one of its subtasks), with its description. */
export async function getPublicShareTask(token: string, taskId: string): Promise<PublicShareTaskDetail> {
  const link = await activeLink(token);
  if (link.resourceType !== "list") throw new NotFoundError("Task not found");
  const task = await prisma.task.findFirst({
    where: { id: taskId, listId: link.listId! },
    select: {
      ...taskSelect,
      description: true,
      subtasks: {
        select: {
          id: true,
          name: true,
          statusId: true,
          priority: true,
          endDate: true,
          status: { select: { type: true } },
          assignees: { select: { user: { select: personSelect } }, orderBy: { createdAt: "asc" } },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
  if (!task) throw new NotFoundError("Task not found");
  return {
    ...toPublicTask(task),
    description: sanitizeRichText(task.description),
    subtasks: task.subtasks.map((s) => ({
      id: s.id,
      name: s.name,
      statusId: s.statusId,
      priority: s.priority,
      dueDate: s.endDate?.toISOString() ?? null,
      assignees: s.assignees.map((a) => person(a.user)),
    })),
  };
}

/** The shared doc itself or one of its sub-pages; any other page is a 404. */
export async function getPublicSharePage(token: string, docId: string): Promise<PublicSharePage> {
  const link = await activeLink(token);
  if (link.resourceType !== "doc") throw new NotFoundError("Page not found");
  const rootId = link.docId!;
  const page = await prisma.doc.findUnique({ where: { id: docId }, select: { ...pageSelect, workspaceId: true } });
  if (!page) throw new NotFoundError("Page not found");
  if (docId !== rootId) {
    const spacePages = await prisma.doc.findMany({ where: { workspaceId: page.workspaceId }, select: { id: true, parentId: true } });
    if (!descendantPageIds(rootId, spacePages).has(docId)) throw new NotFoundError("Page not found");
  }
  return toPublicPage(page, docId === rootId);
}
