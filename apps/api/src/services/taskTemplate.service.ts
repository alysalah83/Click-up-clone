import { randomUUID } from "node:crypto";
import {
  dueDateFromOffset,
  dueOffsetDays,
  richTextDocSchema,
  taskTemplateSnapshotSchema,
  type ApplyTaskTemplateInput,
  type SaveTaskAsTemplateInput,
  type TaskTemplateSnapshot,
  type UpdateTaskTemplateInput,
} from "@clickup/shared";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess, assertStatusInList, memberOf } from "./access.service.js";
import { assigneeUserSelect, taskInclude, toTaskDto } from "./task.dto.js";
import { syncCompletedAt } from "./completion.service.js";
import { runAutomations } from "./automation.service.js";

const templateSelect = {
  id: true,
  workspaceId: true,
  name: true,
  description: true,
  snapshot: true,
  createdAt: true,
  updatedAt: true,
  workspace: { select: { id: true, name: true } },
  createdBy: { select: assigneeUserSelect },
} satisfies Prisma.TaskTemplateSelect;

type TemplateRow = Prisma.TaskTemplateGetPayload<{ select: typeof templateSelect }>;

/** Stored snapshots are re-validated on read, so the client always gets every field. */
function toTemplateDto(row: TemplateRow) {
  return { ...row, snapshot: taskTemplateSnapshotSchema.parse(row.snapshot) };
}

/** Templates of one space (membership-checked), or of every space I belong to. */
export async function listTemplates(userId: string, workspaceId?: string) {
  if (workspaceId) await assertCanAccess(userId, { workspaceId });
  const rows = await prisma.taskTemplate.findMany({
    where: workspaceId ? { workspaceId } : { workspace: memberOf(userId) },
    select: templateSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toTemplateDto);
}

/** A template the user can reach; a non-member gets the same 404 as a missing template. */
async function accessibleTemplate(userId: string, id: string) {
  const template = await prisma.taskTemplate.findFirst({
    where: { id, workspace: memberOf(userId) },
    select: templateSelect,
  });
  if (!template) throw new NotFoundError("Template not found");
  return template;
}

const ordered: { order?: "asc"; createdAt?: "asc" }[] = [{ order: "asc" }, { createdAt: "asc" }];

const snapshotTaskSelect = {
  name: true,
  description: true,
  priority: true,
  points: true,
  createdAt: true,
  endDate: true,
  tags: { select: { tag: { select: { name: true, color: true } } }, orderBy: { tag: { name: "asc" } } },
  subtasks: { select: { name: true, priority: true }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  checklists: { orderBy: ordered, select: { name: true, items: { orderBy: ordered, select: { text: true } } } },
} satisfies Prisma.TaskSelect;

/** The task, its subtasks (name + priority) and its checklists (items unchecked), as a snapshot. */
export function taskSnapshot(task: Prisma.TaskGetPayload<{ select: typeof snapshotTaskSelect }>): TaskTemplateSnapshot {
  const description = richTextDocSchema.safeParse(task.description);
  return taskTemplateSnapshotSchema.parse({
    name: task.name,
    description: description.success ? description.data : null,
    priority: task.priority,
    points: task.points,
    tags: task.tags.slice(0, 20).map(({ tag }) => tag),
    dueInDays: dueOffsetDays(task.createdAt, task.endDate),
    subtasks: task.subtasks.slice(0, 50),
    checklists: task.checklists
      .slice(0, 20)
      .map((c) => ({ name: c.name, items: c.items.slice(0, 100).map((i) => i.text) })),
  });
}

export async function saveTaskAsTemplate(userId: string, input: SaveTaskAsTemplateInput) {
  const { workspaceId } = await assertCanAccess(userId, { taskId: input.taskId }, "member");
  const task = await prisma.task.findUniqueOrThrow({ where: { id: input.taskId }, select: snapshotTaskSelect });
  const created = await prisma.taskTemplate.create({
    data: {
      workspaceId,
      name: input.name,
      description: input.description ?? "",
      snapshot: taskSnapshot(task) as Prisma.InputJsonObject,
      createdById: userId,
    },
    select: templateSelect,
  });
  return toTemplateDto(created);
}

export async function updateTemplate(userId: string, id: string, input: UpdateTaskTemplateInput) {
  const template = await accessibleTemplate(userId, id);
  await assertCanAccess(userId, { workspaceId: template.workspaceId }, "member");
  return toTemplateDto(await prisma.taskTemplate.update({ where: { id }, data: input, select: templateSelect }));
}

export async function deleteTemplate(userId: string, id: string) {
  const template = await accessibleTemplate(userId, id);
  await assertCanAccess(userId, { workspaceId: template.workspaceId }, "member");
  await prisma.taskTemplate.delete({ where: { id } });
  return { id };
}

/**
 * Creates a task from a template in one transaction: the task (name, description, priority,
 * points, relative due date), its subtasks in the list's open status, its checklists with
 * unchecked items, and its tags (reused by name in the list's space, created when missing),
 * plus a "created from template" activity entry.
 */
export async function applyTemplate(userId: string, id: string, input: ApplyTaskTemplateInput, now = new Date()) {
  const template = await accessibleTemplate(userId, id);
  const { workspaceId } = await assertCanAccess(userId, { listId: input.listId });
  await assertStatusInList(userId, input.statusId, input.listId);
  const parsed = taskTemplateSnapshotSchema.parse(template.snapshot);

  const openStatus = await prisma.status.findFirst({
    where: { listId: input.listId },
    orderBy: [{ type: "asc" }, { order: "asc" }],
    select: { id: true },
  });
  const due = parsed.dueInDays === null ? null : dueDateFromOffset(now, parsed.dueInDays);
  const taskId = randomUUID();
  const at = (ms: number) => new Date(now.getTime() + ms);

  await prisma.$transaction(async (tx) => {
    await tx.task.create({
      data: {
        id: taskId,
        userId,
        listId: input.listId,
        statusId: input.statusId,
        name: input.name ?? parsed.name,
        priority: parsed.priority,
        points: parsed.points,
        startDate: due,
        endDate: due,
        description: parsed.description === null ? Prisma.DbNull : (parsed.description as Prisma.InputJsonObject),
        createdAt: now,
      },
    });
    if (parsed.subtasks.length > 0)
      await tx.task.createMany({
        data: parsed.subtasks.map((s, i) => ({
          userId,
          listId: input.listId,
          statusId: openStatus?.id ?? input.statusId,
          parentTaskId: taskId,
          name: s.name,
          priority: s.priority,
          // Subtasks are listed by creation time: keep the template's order.
          createdAt: at(i + 1),
        })),
      });
    const checklists = parsed.checklists.map((c, order) => ({ id: randomUUID(), taskId, name: c.name, order }));
    if (checklists.length > 0) {
      await tx.checklist.createMany({ data: checklists });
      await tx.checklistItem.createMany({
        data: parsed.checklists.flatMap((c, i) =>
          c.items.map((text, order) => ({ checklistId: checklists[i]!.id, text, order })),
        ),
      });
    }
    if (parsed.tags.length > 0) {
      await tx.tag.createMany({
        data: parsed.tags.map((t) => ({ workspaceId, name: t.name, color: t.color })),
        skipDuplicates: true,
      });
      const tags = await tx.tag.findMany({
        where: { workspaceId, name: { in: parsed.tags.map((t) => t.name) } },
        select: { id: true },
      });
      await tx.taskTag.createMany({ data: tags.map((t) => ({ taskId, tagId: t.id })), skipDuplicates: true });
    }
    await tx.activity.create({
      data: { taskId, actorId: userId, type: "created_from_template", data: { name: template.name }, createdAt: now },
    });
  });

  await syncCompletedAt([taskId]);
  await runAutomations(userId, { type: "task_created", taskId });
  return toTaskDto(await prisma.task.findUniqueOrThrow({ where: { id: taskId }, include: taskInclude }));
}
