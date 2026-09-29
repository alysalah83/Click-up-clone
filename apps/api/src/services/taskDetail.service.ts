import type {
  CreateChecklistInput,
  CreateChecklistItemInput,
  CreateSubtaskInput,
  CreateTagInput,
  UpdateChecklistInput,
  UpdateChecklistItemInput,
  UpdateDescriptionInput,
  UpdateTagInput,
} from "@clickup/shared";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError, ValidationError } from "../lib/errors/index.js";
import { assertCanAccess, assertStatusInList } from "./access.service.js";
import { logActivity, logDescriptionEdit } from "./activity.service.js";
import { tagSelect, taskInclude, toTaskDto } from "./task.dto.js";

const ACTIVITY_LIMIT = 100;

const checklistsInclude = {
  orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  include: { items: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
} as const satisfies Prisma.Task$checklistsArgs;

/** The task page: the task plus its subtasks, checklists, tags, breadcrumb and activity (newest first). */
export async function getTaskDetail(userId: string, id: string) {
  await assertCanAccess(userId, { taskId: id });
  const task = await prisma.task.findUniqueOrThrow({
    where: { id },
    include: {
      ...taskInclude,
      list: {
        select: {
          id: true,
          name: true,
          workspace: { select: { id: true, name: true } },
        },
      },
      parentTask: { select: { id: true, name: true } },
      checklists: checklistsInclude,
      activities: {
        orderBy: { createdAt: "desc" },
        take: ACTIVITY_LIMIT,
        select: {
          id: true,
          type: true,
          data: true,
          createdAt: true,
          actor: {
            select: { id: true, name: true, email: true, avatarColor: true },
          },
        },
      },
    },
  });
  const subtasks = await prisma.task.findMany({
    where: { parentTaskId: id },
    include: taskInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const { list, parentTask, checklists, activities, description, ...rest } =
    task;
  return {
    ...toTaskDto({ ...rest, description, checklists }),
    description,
    list: { id: list.id, name: list.name },
    workspace: list.workspace,
    parentTask,
    subtasks: subtasks.map(toTaskDto),
    checklists,
    activity: activities,
  };
}

export async function updateDescription(
  userId: string,
  id: string,
  { description }: UpdateDescriptionInput,
) {
  await assertCanAccess(userId, { taskId: id });
  await prisma.task.update({
    where: { id },
    data: {
      description:
        description === null
          ? Prisma.DbNull
          : (description as Prisma.InputJsonObject),
    },
  });
  await logDescriptionEdit(id, userId);
  return { id, description };
}

/** A subtask is a Task in the parent's list with `parentTaskId` set (one level deep). */
export async function createSubtask(
  userId: string,
  parentId: string,
  input: CreateSubtaskInput,
) {
  await assertCanAccess(userId, { taskId: parentId });
  const parent = await prisma.task.findUniqueOrThrow({
    where: { id: parentId },
    select: { listId: true, parentTaskId: true },
  });
  if (parent.parentTaskId)
    throw new ValidationError("Subtasks cannot have subtasks", {
      formErrors: ["Subtasks cannot have subtasks"],
      fieldErrors: {},
    });

  let statusId = input.statusId;
  if (statusId) await assertStatusInList(userId, statusId, parent.listId);
  else {
    const open = await prisma.status.findFirst({
      where: { listId: parent.listId },
      orderBy: [{ type: "asc" }, { order: "asc" }],
      select: { id: true },
    });
    statusId = open!.id;
  }

  const subtask = await prisma.task.create({
    data: {
      name: input.name,
      userId,
      listId: parent.listId,
      statusId,
      parentTaskId: parentId,
    },
    include: taskInclude,
  });
  await logActivity([
    { taskId: subtask.id, actorId: userId, type: "created" },
    {
      taskId: parentId,
      actorId: userId,
      type: "subtask_added",
      data: { subtaskId: subtask.id, name: subtask.name },
    },
  ]);
  return toTaskDto(subtask);
}

// --- Checklists ------------------------------------------------------------------------------

async function taskIdOfChecklist(checklistId: string) {
  const checklist = await prisma.checklist.findUnique({
    where: { id: checklistId },
    select: { taskId: true },
  });
  if (!checklist) throw new NotFoundError("Checklist not found");
  return checklist.taskId;
}

async function checklistItemContext(itemId: string) {
  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    select: { done: true, text: true, checklist: { select: { taskId: true } } },
  });
  if (!item) throw new NotFoundError("Checklist item not found");
  return item;
}

export async function createChecklist(
  userId: string,
  taskId: string,
  { name }: CreateChecklistInput,
) {
  await assertCanAccess(userId, { taskId });
  const order = await prisma.checklist.count({ where: { taskId } });
  return prisma.checklist.create({
    data: { taskId, name, order },
    include: { items: true },
  });
}

export async function updateChecklist(
  userId: string,
  id: string,
  { name }: UpdateChecklistInput,
) {
  await assertCanAccess(userId, { taskId: await taskIdOfChecklist(id) });
  return prisma.checklist.update({ where: { id }, data: { name } });
}

export async function deleteChecklist(userId: string, id: string) {
  await assertCanAccess(userId, { taskId: await taskIdOfChecklist(id) });
  await prisma.checklist.delete({ where: { id } });
}

export async function createChecklistItem(
  userId: string,
  checklistId: string,
  { text }: CreateChecklistItemInput,
) {
  await assertCanAccess(userId, {
    taskId: await taskIdOfChecklist(checklistId),
  });
  const last = await prisma.checklistItem.findFirst({
    where: { checklistId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return prisma.checklistItem.create({
    data: { checklistId, text, order: (last?.order ?? -1) + 1 },
  });
}

export async function updateChecklistItem(
  userId: string,
  id: string,
  data: UpdateChecklistItemInput,
) {
  const item = await checklistItemContext(id);
  const taskId = item.checklist.taskId;
  const { workspaceId } = await assertCanAccess(userId, { taskId });
  if (data.assigneeId) {
    const member = await prisma.workspaceMember.count({
      where: { workspaceId, userId: data.assigneeId },
    });
    if (member === 0)
      throw new ValidationError("Assignee must be a member of the workspace", {
        formErrors: [],
        fieldErrors: {
          assigneeId: ["Assignee must be a member of the workspace"],
        },
      });
  }
  const updated = await prisma.checklistItem.update({ where: { id }, data });
  if (data.done === true && !item.done)
    await logActivity([
      {
        taskId,
        actorId: userId,
        type: "checklist_item_done",
        data: { text: updated.text },
      },
    ]);
  return updated;
}

export async function deleteChecklistItem(userId: string, id: string) {
  const item = await checklistItemContext(id);
  await assertCanAccess(userId, { taskId: item.checklist.taskId });
  await prisma.checklistItem.delete({ where: { id } });
}

// --- Tags ------------------------------------------------------------------------------------

export async function listTags(userId: string, workspaceId: string) {
  await assertCanAccess(userId, { workspaceId });
  return prisma.tag.findMany({
    where: { workspaceId },
    select: tagSelect,
    orderBy: { name: "asc" },
  });
}

export async function createTag(
  userId: string,
  workspaceId: string,
  input: CreateTagInput,
) {
  await assertCanAccess(userId, { workspaceId }, "member");
  return prisma.tag.create({
    data: { ...input, workspaceId },
    select: tagSelect,
  });
}

async function workspaceIdOfTag(tagId: string) {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { workspaceId: true, name: true, color: true },
  });
  if (!tag) throw new NotFoundError("Tag not found");
  return tag;
}

export async function updateTag(
  userId: string,
  id: string,
  input: UpdateTagInput,
) {
  const { workspaceId } = await workspaceIdOfTag(id);
  await assertCanAccess(userId, { workspaceId }, "member");
  return prisma.tag.update({ where: { id }, data: input, select: tagSelect });
}

export async function deleteTag(userId: string, id: string) {
  const { workspaceId } = await workspaceIdOfTag(id);
  await assertCanAccess(userId, { workspaceId }, "member");
  await prisma.tag.delete({ where: { id } });
}

export async function addTagToTask(
  userId: string,
  taskId: string,
  tagId: string,
) {
  const { workspaceId } = await assertCanAccess(userId, { taskId });
  const tag = await workspaceIdOfTag(tagId);
  // A tag from another workspace looks missing, like any id the caller cannot see.
  if (tag.workspaceId !== workspaceId) throw new NotFoundError("Tag not found");
  const { count } = await prisma.taskTag.createMany({
    data: [{ taskId, tagId }],
    skipDuplicates: true,
  });
  if (count > 0)
    await logActivity([
      {
        taskId,
        actorId: userId,
        type: "tag_added",
        data: { name: tag.name, color: tag.color },
      },
    ]);
}

export async function removeTagFromTask(
  userId: string,
  taskId: string,
  tagId: string,
) {
  await assertCanAccess(userId, { taskId });
  await prisma.taskTag.deleteMany({ where: { taskId, tagId } });
}
