import type { MemberRole, Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors/index.js";

export type AccessTarget =
  | { workspaceId: string }
  | { listId: string }
  | { statusId: string }
  | { taskId: string };

const ROLE_RANK: Record<MemberRole, number> = { guest: 0, member: 1, admin: 2, owner: 3 };

/** Prisma filter: workspaces the user is a member of. */
export const memberOf = (userId: string) => ({ members: { some: { userId } } }) satisfies Prisma.WorkspaceWhereInput;
/** Prisma filter for lists, statuses (via list) and tasks (via list) in the user's workspaces. */
export const listInMyWorkspaces = (userId: string) =>
  ({ workspace: memberOf(userId) }) satisfies Prisma.ListWhereInput;
export const inMyWorkspaces = (userId: string) => ({ list: listInMyWorkspaces(userId) });

async function workspaceIdOf(target: AccessTarget): Promise<{ entity: string; workspaceId?: string }> {
  if ("workspaceId" in target) return { entity: "Workspace", workspaceId: target.workspaceId };
  if ("listId" in target) {
    const list = await prisma.list.findUnique({ where: { id: target.listId }, select: { workspaceId: true } });
    return { entity: "List", workspaceId: list?.workspaceId };
  }
  if ("statusId" in target) {
    const status = await prisma.status.findUnique({
      where: { id: target.statusId },
      select: { list: { select: { workspaceId: true } } },
    });
    return { entity: "Status", workspaceId: status?.list.workspaceId };
  }
  const task = await prisma.task.findUnique({
    where: { id: target.taskId },
    select: { list: { select: { workspaceId: true } } },
  });
  return { entity: "Task", workspaceId: task?.list.workspaceId };
}

/**
 * Throws 404 unless `userId` is a member of the workspace that holds the target.
 * Non-member and missing look the same, so IDs from other accounts are not revealed.
 * With `minRole`, a member below that role gets 403. Returns the workspace id and role.
 */
export async function assertCanAccess(
  userId: string,
  target: AccessTarget,
  minRole: MemberRole = "guest",
): Promise<{ workspaceId: string; role: MemberRole }> {
  const { entity, workspaceId } = await workspaceIdOf(target);
  const membership = workspaceId
    ? await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
        select: { role: true },
      })
    : null;
  if (!workspaceId || !membership) throw new NotFoundError(`${entity} not found`);
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole])
    throw new ForbiddenError(`Only a workspace ${minRole} or above can do this`);
  return { workspaceId, role: membership.role };
}

export function hasRole(role: MemberRole, minRole: MemberRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/** A task's status must come from the same list as the task (and be visible to the caller). */
export async function assertStatusInList(userId: string, statusId: string, listId: string) {
  const count = await prisma.status.count({
    where: { id: statusId, listId, list: listInMyWorkspaces(userId) },
  });
  if (count === 0)
    throw new ValidationError("Status does not belong to this list", {
      formErrors: [],
      fieldErrors: { statusId: ["Status does not belong to this list"] },
    });
}
