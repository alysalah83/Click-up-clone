import {
  automationActionSchema,
  automationTriggerSchema,
  type AutomationAction,
  type CreateAutomationInput,
  type UpdateAutomationInput,
} from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { syncCompletedAt } from "./completion.service.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess } from "./access.service.js";
import { logActivity, type ActivityRow } from "./activity.service.js";
import { actorName, createNotifications } from "./notification.service.js";

export type AutomationEvent =
  | { type: "task_created"; taskId: string }
  | { type: "status_changed"; taskId: string; statusId: string };

const bad = (field: string, message: string) =>
  new ValidationError(message, { formErrors: [], fieldErrors: { [field]: [message] } });

async function automationInMyWorkspace(userId: string, id: string) {
  const automation = await prisma.automation.findUnique({ where: { id } });
  if (!automation) throw new NotFoundError("Automation not found");
  await assertCanAccess(userId, { listId: automation.listId }).catch(() => {
    throw new NotFoundError("Automation not found");
  });
  return automation;
}

export async function listAutomations(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  return prisma.automation.findMany({ where: { listId }, orderBy: { createdAt: "asc" } });
}

export async function createAutomation(userId: string, listId: string, input: CreateAutomationInput) {
  const { workspaceId } = await assertCanAccess(userId, { listId }, "member");
  const statusIds = [
    ...(input.trigger.type === "status_changed" && input.trigger.to !== "done" ? [input.trigger.to] : []),
    ...input.actions.flatMap((a) => (a.type === "set_status" ? [a.statusId] : [])),
  ];
  if (statusIds.length > 0) {
    const count = await prisma.status.count({ where: { id: { in: [...new Set(statusIds)] }, listId } });
    if (count !== new Set(statusIds).size) throw bad("actions", "Status does not belong to this list");
  }
  const userIds = input.actions.flatMap((a) => (a.type === "assign_user" ? [a.userId] : []));
  if (userIds.length > 0) {
    const count = await prisma.workspaceMember.count({ where: { workspaceId, userId: { in: userIds } } });
    if (count !== new Set(userIds).size) throw bad("actions", "Assignee must be a member of the workspace");
  }
  return prisma.automation.create({ data: { listId, ...input } });
}

export async function updateAutomation(userId: string, id: string, { enabled }: UpdateAutomationInput) {
  const automation = await automationInMyWorkspace(userId, id);
  await assertCanAccess(userId, { listId: automation.listId }, "member");
  return prisma.automation.update({ where: { id }, data: { enabled } });
}

export async function deleteAutomation(userId: string, id: string) {
  const automation = await automationInMyWorkspace(userId, id);
  await assertCanAccess(userId, { listId: automation.listId }, "member");
  await prisma.automation.delete({ where: { id } });
  return { id };
}

const describe = (action: AutomationAction) =>
  ({
    notify_assignees: "notified assignees",
    assign_user: "assigned a user",
    set_priority: `set priority to ${"priority" in action ? action.priority : ""}`,
    set_status: "changed the status",
  })[action.type];

/**
 * Runs the enabled automations of the task's list that match `event`, synchronously.
 * Loop guard: actions write straight to the database and never call the task services, so an
 * action (e.g. set_status) cannot trigger another automation. Failures never fail the request.
 */
export async function runAutomations(actorId: string, event: AutomationEvent): Promise<void> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: event.taskId },
      select: { id: true, name: true, listId: true, priority: true },
    });
    if (!task) return;
    const automations = await prisma.automation.findMany({ where: { listId: task.listId, enabled: true } });
    if (automations.length === 0) return;

    let doneStatus = false;
    if (event.type === "status_changed") {
      const status = await prisma.status.findUnique({ where: { id: event.statusId }, select: { type: true } });
      doneStatus = status?.type === "done";
    }

    for (const automation of automations) {
      const trigger = automationTriggerSchema.safeParse(automation.trigger);
      if (!trigger.success || trigger.data.type !== event.type) continue;
      if (
        trigger.data.type === "status_changed" &&
        event.type === "status_changed" &&
        !(trigger.data.to === "done" ? doneStatus : trigger.data.to === event.statusId)
      )
        continue;

      const actions = automationActionSchema.array().safeParse(automation.actions);
      if (!actions.success) continue;
      const done: string[] = [];
      for (const action of actions.data) {
        if (await runAction(actorId, task, automation.name, action)) done.push(describe(action));
      }
      const rows: ActivityRow[] = [
        {
          taskId: task.id,
          actorId,
          type: "automation",
          data: { name: automation.name, summary: done.join(", ") || "no changes" },
        },
      ];
      await logActivity(rows);
    }
  } catch (error) {
    console.error("Automation run failed", error);
  }
}

async function runAction(
  actorId: string,
  task: { id: string; name: string; listId: string },
  automationName: string,
  action: AutomationAction,
): Promise<boolean> {
  switch (action.type) {
    case "notify_assignees": {
      const assignees = await prisma.taskAssignee.findMany({ where: { taskId: task.id }, select: { userId: true } });
      const actor = await actorName(actorId);
      await createNotifications(
        assignees.map(({ userId }) => ({
          userId,
          actorId,
          type: "TASK_UPDATED" as const,
          taskId: task.id,
          message: `Automation "${automationName}" ran on "${task.name}" (triggered by ${actor})`,
        })),
      );
      return assignees.length > 0;
    }
    case "assign_user": {
      const { count } = await prisma.taskAssignee.createMany({
        data: [{ taskId: task.id, userId: action.userId }],
        skipDuplicates: true,
      });
      return count > 0;
    }
    case "set_priority":
      await prisma.task.update({ where: { id: task.id }, data: { priority: action.priority } });
      return true;
    case "set_status": {
      const valid = await prisma.status.count({ where: { id: action.statusId, listId: task.listId } });
      if (!valid) return false;
      await prisma.task.update({ where: { id: task.id }, data: { statusId: action.statusId } });
      await syncCompletedAt([task.id]);
      return true;
    }
  }
}
