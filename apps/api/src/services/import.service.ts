import { randomUUID } from "node:crypto";
import { tagColorFor, textToRichDoc, type ImportPayloadInput } from "@clickup/shared";
import type { StatusType } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HIGHEST_ORDER } from "../consts/status.const.js";
import { assertCanAccess } from "./access.service.js";

const STATUS_ICON: Record<StatusType, string> = { open: "circleDotted", active: "inProgress", done: "complete" };
const SOURCE_LABEL = { csv: "CSV", trello: "Trello" } as const;

/**
 * Creates a list from a parsed CSV file or Trello board in one transaction: the list, its
 * statuses (one open first, actives in source order, one done last), tags (reused by name in the
 * space, created when missing), the tasks with their assignees (members matched by name or email,
 * others ignored), tags and checklists, and an "imported from" activity entry per task.
 */
export async function importList(userId: string, input: ImportPayloadInput, now = new Date()) {
  const { workspaceId } = await assertCanAccess(userId, { workspaceId: input.workspaceId }, "member");

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });
  const memberByKey = new Map<string, string>();
  for (const m of members) {
    if (m.user.name) memberByKey.set(m.user.name.trim().toLowerCase(), m.userId);
    if (m.user.email) memberByKey.set(m.user.email.trim().toLowerCase(), m.userId);
  }

  const listId = randomUUID();
  let activeOrder = 100;
  const statuses = input.statuses.map((s) => {
    const order = s.type === "open" ? 100 : s.type === "done" ? HIGHEST_ORDER : (activeOrder += 100);
    return {
      id: randomUUID(),
      listId,
      userId,
      name: s.name,
      icon: STATUS_ICON[s.type],
      iconColor: s.color,
      bgColor: s.color,
      type: s.type,
      order,
      isDefault: s.type !== "active" || order === 200,
    };
  });
  const statusByName = new Map(statuses.map((s) => [s.name.toLowerCase(), s]));

  const tagColors = new Map(input.tags.map((t) => [t.name, t.color]));
  for (const task of input.tasks) for (const tag of task.tags) if (!tagColors.has(tag)) tagColors.set(tag, tagColorFor(tag));

  const tasks = input.tasks.map((task, i) => {
    const status = statusByName.get(task.status.toLowerCase())!;
    const endDate = task.dueDate ? new Date(task.dueDate) : null;
    return {
      id: randomUUID(),
      userId,
      listId,
      statusId: status.id,
      name: task.name,
      priority: task.priority,
      points: task.points,
      startDate: task.startDate ? new Date(task.startDate) : endDate,
      endDate,
      description: task.description ? textToRichDoc(task.description) : undefined,
      completedAt: status.type === "done" ? now : null,
      // Views list tasks by creation time: keep the file's order.
      createdAt: new Date(now.getTime() + i),
    };
  });

  const assignees = input.tasks.flatMap((task, i) => {
    const ids = new Set(task.assignees.map((a) => memberByKey.get(a.trim().toLowerCase())).filter((id) => id !== undefined));
    return [...ids].map((assigneeId) => ({ taskId: tasks[i]!.id, userId: assigneeId }));
  });
  const checklists = input.tasks.flatMap((task, i) =>
    task.checklists.map((c, order) => ({ id: randomUUID(), taskId: tasks[i]!.id, name: c.name, order, items: c.items })),
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.list.create({ data: { id: listId, name: input.listName, workspaceId, userId, createdAt: now } });
      await tx.status.createMany({ data: statuses });

      let tagIds = new Map<string, string>();
      if (tagColors.size > 0) {
        await tx.tag.createMany({
          data: [...tagColors].map(([name, color]) => ({ workspaceId, name, color })),
          skipDuplicates: true,
        });
        const rows = await tx.tag.findMany({
          where: { workspaceId, name: { in: [...tagColors.keys()] } },
          select: { id: true, name: true },
        });
        tagIds = new Map(rows.map((t) => [t.name, t.id]));
      }

      if (tasks.length === 0) return;
      await tx.task.createMany({ data: tasks });
      if (assignees.length > 0) await tx.taskAssignee.createMany({ data: assignees, skipDuplicates: true });
      const taskTags = input.tasks.flatMap((task, i) =>
        task.tags.flatMap((name) => {
          const tagId = tagIds.get(name);
          return tagId ? [{ taskId: tasks[i]!.id, tagId }] : [];
        }),
      );
      if (taskTags.length > 0) await tx.taskTag.createMany({ data: taskTags, skipDuplicates: true });
      if (checklists.length > 0) {
        await tx.checklist.createMany({ data: checklists.map(({ items: _items, ...c }) => c) });
        const items = checklists.flatMap((c) => c.items.map((item, order) => ({ checklistId: c.id, text: item.text, done: item.done, order })));
        if (items.length > 0) await tx.checklistItem.createMany({ data: items });
      }
      await tx.activity.createMany({
        data: tasks.map((t) => ({
          taskId: t.id,
          actorId: userId,
          type: "imported",
          data: { source: SOURCE_LABEL[input.source] },
          createdAt: t.createdAt,
        })),
      });
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  return {
    listId,
    workspaceId,
    tasksCount: tasks.length,
    statusesCount: statuses.length,
    tagsCount: tagColors.size,
    assigneesCount: assignees.length,
  };
}
