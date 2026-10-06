import type { CreateWhiteboardInput, UpdateWhiteboardInput, WhiteboardTaskInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, memberOf } from "./access.service.js";
import { createTask } from "./task.service.js";

/** The sidebar and the index page need no scene, so the list stays light. */
const summary = { id: true, workspaceId: true, title: true, createdAt: true, updatedAt: true };
const full = { ...summary, scene: true, createdById: true };

/** Boards of one space (membership-checked), or of every space I belong to. */
export async function listWhiteboards(userId: string, workspaceId?: string) {
  if (workspaceId) await assertCanAccess(userId, { workspaceId });
  return prisma.whiteboard.findMany({
    where: workspaceId ? { workspaceId } : { workspace: memberOf(userId) },
    select: summary,
    orderBy: { createdAt: "asc" },
  });
}

/** Loads a board the user can reach; a non-member gets the same 404 as a missing board. */
async function accessibleBoard(userId: string, id: string) {
  const board = await prisma.whiteboard.findFirst({
    where: { id, workspace: memberOf(userId) },
    select: { id: true, workspaceId: true },
  });
  if (!board) throw new NotFoundError("Whiteboard not found");
  return board;
}

export async function getWhiteboard(userId: string, id: string) {
  await accessibleBoard(userId, id);
  return prisma.whiteboard.findUniqueOrThrow({ where: { id }, select: full });
}

export async function createWhiteboard(userId: string, input: CreateWhiteboardInput) {
  await assertCanAccess(userId, { workspaceId: input.workspaceId }, "member");
  return prisma.whiteboard.create({
    data: {
      workspaceId: input.workspaceId,
      title: input.title ?? "",
      scene: input.scene ?? "",
      createdById: userId,
    },
    select: full,
  });
}

/** Renames and/or saves the scene. Returns the summary: the editor already holds the scene. */
export async function updateWhiteboard(userId: string, id: string, input: UpdateWhiteboardInput) {
  const { workspaceId } = await accessibleBoard(userId, id);
  await assertCanAccess(userId, { workspaceId }, "member");
  return prisma.whiteboard.update({ where: { id }, data: input, select: summary });
}

export async function deleteWhiteboard(userId: string, id: string) {
  const { workspaceId } = await accessibleBoard(userId, id);
  await assertCanAccess(userId, { workspaceId }, "member");
  await prisma.whiteboard.delete({ where: { id } });
  return { id };
}

/**
 * Creates a task from a sticky note, in a list of the board's own space, with the list's
 * default status (else its first one). Goes through the normal task creation, so activity
 * and automations run as usual.
 */
export async function createTaskFromNote(userId: string, id: string, input: WhiteboardTaskInput) {
  const { workspaceId } = await accessibleBoard(userId, id);
  const list = await prisma.list.findFirst({
    where: { id: input.listId, workspaceId },
    select: { status: { select: { id: true }, orderBy: [{ isDefault: "desc" }, { order: "asc" }], take: 1 } },
  });
  if (!list) {
    const message = "List does not belong to this space";
    throw new ValidationError(message, { formErrors: [], fieldErrors: { listId: [message] } });
  }
  const statusId = list.status[0]?.id;
  if (!statusId) throw new NotFoundError("The list has no status");
  return createTask(userId, { listId: input.listId, statusId, name: input.name, priority: "none" });
}
