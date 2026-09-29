import type {
  CreateWorkspaceFlowInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { defaultStatusesFor } from "../consts/status.const.js";
import { assertCanAccess, memberOf } from "./access.service.js";
import { taskInclude, toTaskDto } from "./task.dto.js";

const withAvatar = { avatar: true } as const;

export function listWorkspaces(userId: string, includeLists = false) {
  return prisma.workspace.findMany({
    where: memberOf(userId),
    include: {
      ...withAvatar,
      ...(includeLists && { lists: { orderBy: { createdAt: "asc" } } }),
    },
    orderBy: { createdAt: "asc" },
  });
}

export function countWorkspaces(userId: string) {
  return prisma.workspace.count({ where: memberOf(userId) });
}

export async function getWorkspace(userId: string, id: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { id, ...memberOf(userId) },
    include: withAvatar,
  });
  if (!workspace) throw new NotFoundError("Workspace not found");
  return workspace;
}

export function createWorkspace(userId: string, { name, avatar }: CreateWorkspaceInput) {
  return prisma.workspace.create({
    data: {
      name,
      user: { connect: { id: userId } },
      avatar: { create: avatar },
      members: { create: { userId, role: "owner" } },
    },
    include: withAvatar,
  });
}

export async function updateWorkspace(userId: string, id: string, { name, avatar }: UpdateWorkspaceInput) {
  await assertCanAccess(userId, { workspaceId: id }, "admin");
  return prisma.workspace.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(avatar && { avatar: { update: avatar } }),
    },
    include: withAvatar,
  });
}

export async function deleteWorkspace(userId: string, id: string) {
  await assertCanAccess(userId, { workspaceId: id }, "owner");
  const workspace = await getWorkspace(userId, id);
  // Sequential: the workspace row references the avatar (ON DELETE RESTRICT).
  await prisma.$transaction([
    prisma.workspace.delete({ where: { id } }),
    prisma.avatar.delete({ where: { id: workspace.avatarId } }),
  ]);
}

export async function createWorkspaceFlow(userId: string, { data }: CreateWorkspaceFlowInput) {
  const { workspace, list, status, task } = data;

  const result = await prisma.$transaction(async (tx) => {
    const createdAvatar = await tx.avatar.create({ data: workspace.avatar });

    const createdWorkspace = await tx.workspace.create({
      data: {
        name: workspace.name,
        userId,
        avatarId: createdAvatar.id,
        members: { create: { userId, role: "owner" } },
      },
      include: withAvatar,
    });

    const createdList = await tx.list.create({
      data: {
        name: list.name,
        userId,
        workspaceId: createdWorkspace.id,
        status: { createMany: { data: defaultStatusesFor(userId) } },
      },
    });

    const createdStatus = await tx.status.create({
      data: { ...status, userId, listId: createdList.id, order: 300, type: "active" },
    });

    const createdTask = await tx.task.create({
      data: {
        name: task.name,
        priority: task.priority,
        startDate: task.startDate,
        endDate: task.endDate,
        userId,
        listId: createdList.id,
        statusId: createdStatus.id,
      },
      include: taskInclude,
    });

    return { workspace: createdWorkspace, list: createdList, status: createdStatus, task: createdTask };
  });
  return { ...result, task: toTaskDto(result.task) };
}
