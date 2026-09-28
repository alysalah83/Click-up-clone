import type { CreateListInput, UpdateListInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { defaultStatusesFor } from "../consts/status.const.js";
import { assertCanAccess } from "./access.service.js";

export function listLists(userId: string) {
  return prisma.list.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
}

export function countLists(userId: string) {
  return prisma.list.count({ where: { userId } });
}

export async function getList(userId: string, id: string) {
  const list = await prisma.list.findFirst({ where: { id, userId } });
  if (!list) throw new NotFoundError("List not found");
  return list;
}

export function getLatestList(userId: string) {
  return prisma.list.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, workspaceId: true },
  });
}

export async function listWorkspaceLists(userId: string, workspaceId: string) {
  await assertCanAccess(userId, { workspaceId });
  return prisma.list.findMany({ where: { workspaceId, userId }, orderBy: { createdAt: "asc" } });
}

export async function isListInWorkspace(userId: string, listId: string, workspaceId: string) {
  return (await prisma.list.count({ where: { id: listId, workspaceId, userId } })) > 0;
}

export async function createList(userId: string, { name, workspaceId }: CreateListInput) {
  await assertCanAccess(userId, { workspaceId });
  return prisma.list.create({
    data: {
      name,
      workspaceId,
      userId,
      status: { createMany: { data: defaultStatusesFor(userId) } },
    },
    include: { status: { orderBy: { order: "asc" } } },
  });
}

export async function updateList(userId: string, id: string, { name }: UpdateListInput) {
  await assertCanAccess(userId, { listId: id });
  return prisma.list.update({ where: { id }, data: { ...(name !== undefined && { name }) } });
}

export async function deleteList(userId: string, id: string) {
  await assertCanAccess(userId, { listId: id });
  await prisma.list.delete({ where: { id } });
}
