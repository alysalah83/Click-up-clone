import type { CreateDocInput, UpdateDocInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, memberOf } from "./access.service.js";

/** The tree view needs no content, so the list stays light. */
const summary = { id: true, workspaceId: true, parentId: true, title: true, icon: true, updatedAt: true };
const full = { ...summary, content: true, createdById: true, createdAt: true };

/** Docs of one space (membership-checked), or of every space I belong to. */
export async function listDocs(userId: string, workspaceId?: string) {
  if (workspaceId) await assertCanAccess(userId, { workspaceId });
  return prisma.doc.findMany({
    where: workspaceId ? { workspaceId } : { workspace: memberOf(userId) },
    select: summary,
    orderBy: { createdAt: "asc" },
  });
}

/** Loads a doc the user can reach; a non-member gets the same 404 as a missing doc. */
async function accessibleDoc(userId: string, id: string) {
  const doc = await prisma.doc.findFirst({
    where: { id, workspace: memberOf(userId) },
    select: { id: true, workspaceId: true },
  });
  if (!doc) throw new NotFoundError("Doc not found");
  return doc;
}

function parentError(message: string) {
  return new ValidationError(message, { formErrors: [], fieldErrors: { parentId: [message] } });
}

async function assertParentInWorkspace(parentId: string, workspaceId: string) {
  const parent = await prisma.doc.count({ where: { id: parentId, workspaceId } });
  if (parent === 0) throw parentError("Parent page does not belong to this space");
}

export async function getDoc(userId: string, id: string) {
  await accessibleDoc(userId, id);
  return prisma.doc.findUniqueOrThrow({ where: { id }, select: full });
}

export async function createDoc(userId: string, input: CreateDocInput) {
  await assertCanAccess(userId, { workspaceId: input.workspaceId }, "member");
  if (input.parentId) await assertParentInWorkspace(input.parentId, input.workspaceId);
  return prisma.doc.create({
    data: {
      workspaceId: input.workspaceId,
      parentId: input.parentId ?? null,
      title: input.title ?? "",
      icon: input.icon ?? null,
      content: input.content ?? "",
      createdById: userId,
    },
    select: full,
  });
}

export async function updateDoc(userId: string, id: string, input: UpdateDocInput) {
  const { workspaceId } = await accessibleDoc(userId, id);
  await assertCanAccess(userId, { workspaceId }, "member");
  if (input.parentId) {
    await assertParentInWorkspace(input.parentId, workspaceId);
    // A page cannot move under itself or one of its own sub-pages.
    let cursor: string | null = input.parentId;
    while (cursor) {
      if (cursor === id) throw parentError("A page cannot move into its own sub-pages");
      const next: { parentId: string | null } | null = await prisma.doc.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = next?.parentId ?? null;
    }
  }
  return prisma.doc.update({ where: { id }, data: input, select: full });
}

/** Sub-pages go with it (ON DELETE CASCADE). */
export async function deleteDoc(userId: string, id: string) {
  const { workspaceId } = await accessibleDoc(userId, id);
  await assertCanAccess(userId, { workspaceId }, "member");
  await prisma.doc.delete({ where: { id } });
  return { id };
}
