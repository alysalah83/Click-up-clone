import type { CreateListInput, UpdateListInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { defaultStatusesFor } from "../consts/status.const.js";
import { assertCanAccess, inMyWorkspaces, listInMyWorkspaces } from "./access.service.js";

export function listLists(userId: string) {
  return prisma.list.findMany({ where: listInMyWorkspaces(userId), orderBy: { createdAt: "asc" } });
}

export async function listListsWithCounts(userId: string) {
  const [lists, doneGroups] = await Promise.all([
    prisma.list.findMany({
      where: listInMyWorkspaces(userId),
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.task.groupBy({
      by: ["listId"],
      where: { ...inMyWorkspaces(userId), status: { type: "done" } },
      _count: true,
    }),
  ]);

  const completedByListId = new Map(doneGroups.map((g) => [g.listId, g._count]));

  return lists.map(({ _count, ...list }) => ({
    ...list,
    totalTasksCount: _count.tasks,
    completedTasksCount: completedByListId.get(list.id) ?? 0,
  }));
}

export function countLists(userId: string) {
  return prisma.list.count({ where: listInMyWorkspaces(userId) });
}

export async function getList(userId: string, id: string) {
  const list = await prisma.list.findFirst({ where: { id, ...listInMyWorkspaces(userId) } });
  if (!list) throw new NotFoundError("List not found");
  return list;
}

export function getLatestList(userId: string) {
  return prisma.list.findFirst({
    where: listInMyWorkspaces(userId),
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, workspaceId: true },
  });
}

export async function listWorkspaceLists(userId: string, workspaceId: string) {
  await assertCanAccess(userId, { workspaceId });
  return prisma.list.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
}

export async function isListInWorkspace(userId: string, listId: string, workspaceId: string) {
  return (
    (await prisma.list.count({ where: { id: listId, workspaceId, ...listInMyWorkspaces(userId) } })) > 0
  );
}

export async function createList(userId: string, { name, workspaceId }: CreateListInput) {
  await assertCanAccess(userId, { workspaceId }, "member");
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
  await assertCanAccess(userId, { listId: id }, "member");
  return prisma.list.update({ where: { id }, data: { ...(name !== undefined && { name }) } });
}

export async function deleteList(userId: string, id: string) {
  await assertCanAccess(userId, { listId: id }, "member");
  await prisma.list.delete({ where: { id } });
}
