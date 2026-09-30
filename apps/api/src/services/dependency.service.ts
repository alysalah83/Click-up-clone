import type { TaskDependencyDto } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess } from "./access.service.js";

/** All "blocked by" links between tasks of a list (either side in the list). */
export async function listDependencies(userId: string, listId: string): Promise<TaskDependencyDto[]> {
  await assertCanAccess(userId, { listId });
  return prisma.taskDependency.findMany({
    where: { OR: [{ task: { listId } }, { dependsOn: { listId } }] },
    select: { taskId: true, dependsOnId: true },
    orderBy: { createdAt: "asc" },
  });
}

/** True when `from` already (transitively) depends on `target`. */
async function dependsOn(from: string, target: string) {
  const seen = new Set<string>([from]);
  let frontier = [from];
  while (frontier.length) {
    const rows = await prisma.taskDependency.findMany({
      where: { taskId: { in: frontier } },
      select: { dependsOnId: true },
    });
    frontier = [];
    for (const { dependsOnId } of rows) {
      if (dependsOnId === target) return true;
      if (!seen.has(dependsOnId)) {
        seen.add(dependsOnId);
        frontier.push(dependsOnId);
      }
    }
  }
  return false;
}

export async function addDependency(userId: string, taskId: string, dependsOnId: string) {
  if (taskId === dependsOnId) throw new ValidationError("A task cannot depend on itself");
  const [a, b] = await Promise.all([
    assertCanAccess(userId, { taskId }, "member"),
    assertCanAccess(userId, { taskId: dependsOnId }, "member"),
  ]);
  if (a.workspaceId !== b.workspaceId) throw new NotFoundError("Task not found");
  // Adding taskId -> dependsOnId closes a loop if dependsOnId already depends on taskId.
  if (await dependsOn(dependsOnId, taskId)) throw new ValidationError("This link would create a circular dependency");
  await prisma.taskDependency.upsert({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
    create: { taskId, dependsOnId },
    update: {},
  });
  return { taskId, dependsOnId };
}

export async function removeDependency(userId: string, taskId: string, dependsOnId: string) {
  await assertCanAccess(userId, { taskId }, "member");
  await prisma.taskDependency.deleteMany({ where: { taskId, dependsOnId } });
}
