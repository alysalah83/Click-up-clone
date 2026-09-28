import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";

export type AccessTarget =
  | { workspaceId: string }
  | { listId: string }
  | { statusId: string }
  | { taskId: string };

/**
 * Throws 404 unless `userId` may access the target. Not-owned and missing look the same,
 * so IDs from other accounts are not revealed. Spec B re-implements this for workspace
 * membership + roles; callers do not change.
 */
export async function assertCanAccess(userId: string, target: AccessTarget): Promise<void> {
  let entity: string;
  let count: number;

  if ("workspaceId" in target) {
    entity = "Workspace";
    count = await prisma.workspace.count({ where: { id: target.workspaceId, userId } });
  } else if ("listId" in target) {
    entity = "List";
    count = await prisma.list.count({ where: { id: target.listId, userId } });
  } else if ("statusId" in target) {
    entity = "Status";
    count = await prisma.status.count({ where: { id: target.statusId, userId } });
  } else {
    entity = "Task";
    count = await prisma.task.count({ where: { id: target.taskId, userId } });
  }

  if (count === 0) throw new NotFoundError(`${entity} not found`);
}

/** A task's status must come from the same list as the task. */
export async function assertStatusInList(userId: string, statusId: string, listId: string) {
  const count = await prisma.status.count({ where: { id: statusId, listId, userId } });
  if (count === 0)
    throw new ValidationError("Status does not belong to this list", {
      formErrors: [],
      fieldErrors: { statusId: ["Status does not belong to this list"] },
    });
}
