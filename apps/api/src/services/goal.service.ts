import {
  goalProgress,
  targetProgress,
  type CreateGoalInput,
  type CreateGoalTargetInput,
  type UpdateGoalInput,
  type UpdateGoalTargetInput,
} from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, memberOf } from "./access.service.js";
import { assigneeUserSelect } from "./task.dto.js";

const linkedTaskSelect = {
  id: true,
  name: true,
  listId: true,
  points: true,
  status: { select: { id: true, name: true, type: true, icon: true, iconColor: true } },
} as const;

const goalSelect = {
  id: true,
  workspaceId: true,
  name: true,
  description: true,
  color: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: assigneeUserSelect },
  targets: {
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      startValue: true,
      currentValue: true,
      targetValue: true,
      unit: true,
      tasks: { orderBy: { createdAt: "asc" }, select: { task: { select: linkedTaskSelect } } },
    },
  },
} satisfies Prisma.GoalSelect;

type GoalRow = Prisma.GoalGetPayload<{ select: typeof goalSelect }>;

/** Adds live progress: task targets read their linked tasks' status types right now. */
function toGoalDto({ targets, ...goal }: GoalRow) {
  const dtoTargets = targets.map(({ tasks, ...target }) => {
    const linked = tasks.map(({ task }) => ({ ...task, done: task.status.type === "done" }));
    const progress = targetProgress({ ...target, tasks: linked });
    return {
      ...target,
      tasks: linked,
      doneCount: linked.filter((t) => t.done).length,
      progress,
    };
  });
  return { ...goal, targets: dtoTargets, progress: goalProgress(dtoTargets) };
}

function invalid(field: string, message: string): never {
  throw new ValidationError(message, { formErrors: [], fieldErrors: { [field]: [message] } });
}

/** Goals of one space (membership-checked), or of every space I belong to. */
export async function listGoals(userId: string, workspaceId?: string) {
  if (workspaceId) await assertCanAccess(userId, { workspaceId });
  const goals = await prisma.goal.findMany({
    where: workspaceId ? { workspaceId } : { workspace: memberOf(userId) },
    select: goalSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return goals.map(toGoalDto);
}

/** A goal the user can reach; a non-member gets the same 404 as a missing goal. */
async function accessibleGoal(userId: string, id: string) {
  const goal = await prisma.goal.findFirst({
    where: { id, workspace: memberOf(userId) },
    select: { id: true, workspaceId: true },
  });
  if (!goal) throw new NotFoundError("Goal not found");
  return goal;
}

/** Same as `accessibleGoal`, for editing (member role or above). */
async function editableGoal(userId: string, id: string) {
  const goal = await accessibleGoal(userId, id);
  await assertCanAccess(userId, { workspaceId: goal.workspaceId }, "member");
  return goal;
}

async function readGoal(id: string) {
  return toGoalDto(await prisma.goal.findUniqueOrThrow({ where: { id }, select: goalSelect }));
}

export async function getGoal(userId: string, id: string) {
  await accessibleGoal(userId, id);
  return readGoal(id);
}

async function assertOwnerIsMember(workspaceId: string, ownerId: string | null | undefined) {
  if (!ownerId) return;
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: ownerId } },
    select: { id: true },
  });
  if (!member) invalid("ownerId", "The owner must be a member of this space");
}

/** Every task must live in the goal's space (any list, subtasks included). */
async function assertTasksInSpace(workspaceId: string, taskIds: string[]) {
  const unique = [...new Set(taskIds)];
  const found = await prisma.task.count({ where: { id: { in: unique }, list: { workspaceId } } });
  if (found !== unique.length) invalid("taskIds", "Tasks must belong to the goal's space");
  return unique;
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  await assertCanAccess(userId, { workspaceId: input.workspaceId }, "member");
  const ownerId = input.ownerId === undefined ? userId : input.ownerId;
  await assertOwnerIsMember(input.workspaceId, ownerId);
  const goal = await prisma.goal.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description ?? "",
      color: input.color ?? "violet",
      ownerId,
      dueDate: input.dueDate ?? null,
      createdById: userId,
    },
    select: goalSelect,
  });
  return toGoalDto(goal);
}

export async function updateGoal(userId: string, id: string, input: UpdateGoalInput) {
  const { workspaceId } = await editableGoal(userId, id);
  await assertOwnerIsMember(workspaceId, input.ownerId);
  return toGoalDto(await prisma.goal.update({ where: { id }, data: input, select: goalSelect }));
}

export async function deleteGoal(userId: string, id: string) {
  await editableGoal(userId, id);
  await prisma.goal.delete({ where: { id } });
  return { id };
}

/** Sensible defaults per type: true/false runs 0 -> 1, the others start at 0. */
export async function createTarget(userId: string, goalId: string, input: CreateGoalTargetInput) {
  const { workspaceId } = await editableGoal(userId, goalId);
  const taskIds = input.type === "tasks" && input.taskIds?.length ? await assertTasksInSpace(workspaceId, input.taskIds) : [];
  const isBoolean = input.type === "boolean";
  const order = await prisma.goalTarget.count({ where: { goalId } });
  await prisma.goalTarget.create({
    data: {
      goalId,
      name: input.name,
      type: input.type,
      startValue: isBoolean ? 0 : (input.startValue ?? 0),
      currentValue: isBoolean ? (input.currentValue ?? 0) >= 1 ? 1 : 0 : (input.currentValue ?? input.startValue ?? 0),
      targetValue: isBoolean ? 1 : (input.targetValue ?? (input.type === "tasks" ? 0 : 100)),
      unit: input.type === "currency" ? (input.unit ?? "$") : input.type === "number" ? (input.unit ?? null) : null,
      order,
      tasks: { create: taskIds.map((taskId) => ({ taskId })) },
    },
  });
  return readGoal(goalId);
}

async function targetOf(goalId: string, targetId: string) {
  const target = await prisma.goalTarget.findFirst({ where: { id: targetId, goalId }, select: { id: true, type: true } });
  if (!target) throw new NotFoundError("Target not found");
  return target;
}

export async function updateTarget(userId: string, goalId: string, targetId: string, input: UpdateGoalTargetInput) {
  await editableGoal(userId, goalId);
  const target = await targetOf(goalId, targetId);
  const data =
    target.type === "boolean"
      ? { name: input.name, currentValue: input.currentValue === undefined ? undefined : input.currentValue >= 1 ? 1 : 0 }
      : target.type === "tasks"
        ? { name: input.name }
        : input;
  await prisma.goalTarget.update({ where: { id: targetId }, data });
  await prisma.goal.update({ where: { id: goalId }, data: { updatedAt: new Date() } });
  return readGoal(goalId);
}

export async function deleteTarget(userId: string, goalId: string, targetId: string) {
  await editableGoal(userId, goalId);
  await targetOf(goalId, targetId);
  await prisma.goalTarget.delete({ where: { id: targetId } });
  return readGoal(goalId);
}

export async function linkTasks(userId: string, goalId: string, targetId: string, taskIds: string[]) {
  const { workspaceId } = await editableGoal(userId, goalId);
  const target = await targetOf(goalId, targetId);
  if (target.type !== "tasks") invalid("taskIds", "Only task targets link tasks");
  const ids = await assertTasksInSpace(workspaceId, taskIds);
  await prisma.goalTargetTask.createMany({ data: ids.map((taskId) => ({ targetId, taskId })), skipDuplicates: true });
  return readGoal(goalId);
}

export async function unlinkTask(userId: string, goalId: string, targetId: string, taskId: string) {
  await editableGoal(userId, goalId);
  await targetOf(goalId, targetId);
  await prisma.goalTargetTask.deleteMany({ where: { targetId, taskId } });
  return readGoal(goalId);
}

/** The goals a task counts toward (task panel), with their live progress. */
export async function goalsForTask(userId: string, taskId: string) {
  await assertCanAccess(userId, { taskId });
  const goals = await prisma.goal.findMany({
    where: { targets: { some: { tasks: { some: { taskId } } } } },
    select: goalSelect,
    orderBy: { createdAt: "asc" },
  });
  return goals.map((g) => {
    const { id, name, color, progress } = toGoalDto(g);
    return { id, name, color, progress };
  });
}
