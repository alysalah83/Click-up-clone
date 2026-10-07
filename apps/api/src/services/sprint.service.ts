import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { BadRequestError, ConflictError, NotFoundError } from "../lib/errors/index.js";
import { defaultStatusesFor } from "../consts/status.const.js";
import { buildBurndown, mapStatus, nextSprintWindow, sumPoints } from "../lib/utils/sprint.js";
import { assertCanAccess } from "./access.service.js";
import { activityData } from "./activity.service.js";
import { syncCompletedAt } from "./completion.service.js";

/**
 * Sprints are lists with sprint fields (number, dates, state). They keep every list view;
 * this service adds creating the next sprint, completing one (carrying unfinished tasks over)
 * and the sprint report (burndown + velocity).
 */

const VELOCITY_SPRINTS = 6;

const statusCopy = { name: true, icon: true, iconColor: true, bgColor: true, order: true, type: true, isDefault: true } as const;

async function loadSprint(listId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) throw new NotFoundError("List not found");
  if (list.sprintNumber === null || !list.sprintStart || !list.sprintEnd || !list.sprintState)
    throw new BadRequestError("This list is not a sprint");
  return { ...list, sprintNumber: list.sprintNumber, sprintStart: list.sprintStart, sprintEnd: list.sprintEnd, sprintState: list.sprintState };
}

/** The sprint after `sprintNumber` in the space that is not completed yet. */
function findNextSprint(workspaceId: string, sprintNumber: number) {
  return prisma.list.findFirst({
    where: { workspaceId, sprintNumber: { gt: sprintNumber }, sprintState: { not: "completed" } },
    orderBy: { sprintNumber: "asc" },
    select: { id: true, name: true, sprintNumber: true },
  });
}

/**
 * Creates "Sprint N+1" in the space: the two weeks after the latest sprint (or from today for
 * the first one), with the latest sprint's statuses. It starts active when no sprint is.
 */
async function createSprintList(userId: string, workspaceId: string, now: Date, tx: Prisma.TransactionClient = prisma) {
  const latest = await tx.list.findFirst({
    where: { workspaceId, sprintNumber: { not: null } },
    orderBy: { sprintNumber: "desc" },
    select: { sprintNumber: true, sprintEnd: true, status: { select: statusCopy, orderBy: { order: "asc" } } },
  });
  const hasActive = (await tx.list.count({ where: { workspaceId, sprintState: "active" } })) > 0;
  const number = (latest?.sprintNumber ?? 0) + 1;
  const { start, end } = nextSprintWindow(latest?.sprintEnd, now);
  const statuses = latest?.status.length ? latest.status.map((s) => ({ ...s, userId })) : defaultStatusesFor(userId);
  return tx.list.create({
    data: {
      name: `Sprint ${number}`,
      workspaceId,
      userId,
      sprintNumber: number,
      sprintStart: start,
      sprintEnd: end,
      sprintState: hasActive ? "planned" : "active",
      status: { createMany: { data: statuses } },
    },
    include: { status: { orderBy: { order: "asc" } } },
  });
}

export async function createSprint(userId: string, workspaceId: string, now = new Date()) {
  await assertCanAccess(userId, { workspaceId }, "member");
  return createSprintList(userId, workspaceId, now);
}

/** Header numbers of a sprint: points and task counts, done vs unfinished, and the next sprint. */
export async function getSprint(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  const list = await loadSprint(listId);
  const tasks = await prisma.task.findMany({
    where: { listId, parentTaskId: null },
    select: { points: true, status: { select: { type: true } } },
  });
  const done = tasks.filter((t) => t.status.type === "done");
  const unfinished = tasks.filter((t) => t.status.type !== "done");
  return {
    id: list.id,
    name: list.name,
    workspaceId: list.workspaceId,
    sprintNumber: list.sprintNumber,
    sprintStart: list.sprintStart,
    sprintEnd: list.sprintEnd,
    sprintState: list.sprintState,
    totalPoints: sumPoints(tasks),
    donePoints: sumPoints(done),
    unfinishedPoints: sumPoints(unfinished),
    taskCount: tasks.length,
    doneCount: done.length,
    unfinishedCount: unfinished.length,
    nextSprint: await findNextSprint(list.workspaceId, list.sprintNumber),
  };
}

/**
 * Completes the active sprint: unfinished tasks (with their subtasks) move to the next sprint,
 * created when missing, with statuses mapped by name then type. The sprint keeps a snapshot of
 * committed vs completed points for velocity, each carried task gets a "sprint_carried" activity,
 * and the next sprint becomes active.
 */
export async function completeSprint(userId: string, listId: string, now = new Date()) {
  await assertCanAccess(userId, { listId }, "member");
  const list = await loadSprint(listId);
  if (list.sprintState !== "active") throw new ConflictError("Only the active sprint can be completed");

  const tasks = await prisma.task.findMany({
    where: { listId },
    select: { id: true, parentTaskId: true, points: true, statusId: true, status: { select: { name: true, type: true } } },
  });
  const top = tasks.filter((t) => !t.parentTaskId);
  const unfinished = top.filter((t) => t.status.type !== "done");
  const unfinishedIds = new Set(unfinished.map((t) => t.id));
  // Subtasks (at any depth) follow their top-level task.
  const parentOf = new Map(tasks.map((t) => [t.id, t.parentTaskId]));
  const rootOf = (id: string) => {
    for (let i = 0; i < 10 && parentOf.get(id); i++) id = parentOf.get(id)!;
    return id;
  };
  const moving = tasks.filter((t) => unfinishedIds.has(rootOf(t.id)));

  return prisma.$transaction(async (tx) => {
    const found = await findNextSprint(list.workspaceId, list.sprintNumber);
    const next = found ?? (await createSprintList(userId, list.workspaceId, now, tx));
    const targets = await tx.status.findMany({ where: { listId: next.id } });

    const byTarget = new Map<string, string[]>();
    for (const task of moving) {
      const target = mapStatus(task.status, targets);
      if (!target) throw new ConflictError("The next sprint has no statuses");
      byTarget.set(target, [...(byTarget.get(target) ?? []), task.id]);
    }
    for (const [statusId, ids] of byTarget)
      await tx.task.updateMany({ where: { id: { in: ids } }, data: { listId: next.id, statusId } });

    await tx.list.update({
      where: { id: list.id },
      data: {
        sprintState: "completed",
        sprintCommittedPoints: sumPoints(top),
        sprintCompletedPoints: sumPoints(top.filter((t) => t.status.type === "done")),
      },
    });
    await tx.list.update({ where: { id: next.id }, data: { sprintState: "active" } });
    await tx.activity.createMany({
      data: activityData(
        unfinished.map((t) => ({
          taskId: t.id,
          actorId: userId,
          type: "sprint_carried" as const,
          data: { from: list.name, to: next.name, fromListId: list.id, points: t.points === null ? null : String(t.points) },
        })),
      ),
    });
    return {
      completedSprintId: list.id,
      nextSprint: { id: next.id, name: next.name },
      carriedCount: unfinished.length,
      carriedPoints: sumPoints(unfinished),
      doneCount: top.length - unfinished.length,
    };
  }).then(async (result) => {
    await syncCompletedAt(moving.map((t) => t.id));
    return result;
  });
}

/**
 * Burndown of the sprint (ideal vs remaining per day over its dates) and the velocity of the
 * space's finished sprints (committed vs completed points). Tasks carried out of a finished
 * sprint still count in its burndown as never done there, so the chart stays honest.
 */
export async function sprintReport(userId: string, listId: string, now = new Date()) {
  await assertCanAccess(userId, { listId });
  const list = await loadSprint(listId);

  const [inList, carriedOut, finished] = await Promise.all([
    prisma.task.findMany({
      where: { listId, parentTaskId: null },
      select: { points: true, completedAt: true, updatedAt: true, status: { select: { type: true } } },
    }),
    prisma.activity.findMany({
      where: { type: "sprint_carried", data: { path: ["fromListId"], equals: listId } },
      select: { taskId: true, task: { select: { points: true, listId: true } } },
    }),
    prisma.list.findMany({
      where: { workspaceId: list.workspaceId, sprintState: "completed" },
      orderBy: { sprintNumber: "desc" },
      take: VELOCITY_SPRINTS,
      select: { id: true, name: true, sprintNumber: true, sprintCommittedPoints: true, sprintCompletedPoints: true },
    }),
  ]);

  const carriedIds = new Set<string>();
  const carried = carriedOut.filter((a) => a.task.listId !== listId && !carriedIds.has(a.taskId) && carriedIds.add(a.taskId));
  const burndown = buildBurndown({
    start: list.sprintStart,
    end: list.sprintEnd,
    now,
    tasks: [
      ...inList.map((t) => ({
        points: t.points,
        completedAt: t.status.type === "done" ? (t.completedAt ?? t.updatedAt) : null,
      })),
      ...carried.map((a) => ({ points: a.task.points, completedAt: null })),
    ],
  });

  const velocity = finished.reverse().map((s) => ({
    id: s.id,
    name: s.name,
    committed: s.sprintCommittedPoints ?? 0,
    completed: s.sprintCompletedPoints ?? 0,
  }));
  const average = velocity.length
    ? Math.round(velocity.reduce((sum, s) => sum + s.completed, 0) / velocity.length)
    : 0;

  return {
    sprint: {
      id: list.id,
      name: list.name,
      sprintNumber: list.sprintNumber,
      sprintStart: list.sprintStart,
      sprintEnd: list.sprintEnd,
      sprintState: list.sprintState,
    },
    burndown: { ...burndown, carriedOutCount: carried.length },
    velocity: { sprints: velocity, average },
  };
}
