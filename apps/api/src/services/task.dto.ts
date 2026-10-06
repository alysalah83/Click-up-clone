import type { Prisma } from "../generated/prisma/client.js";

export const assigneeUserSelect = { id: true, name: true, email: true, avatarColor: true } as const;
export const tagSelect = { id: true, name: true, color: true } as const;

/** Every task payload carries its status, assignees, tags and subtask/checklist progress. */
export const taskInclude = {
  status: true,
  assignees: {
    select: { user: { select: assigneeUserSelect } },
    orderBy: { createdAt: "asc" },
  },
  tags: { select: { tag: { select: tagSelect } }, orderBy: { tag: { name: "asc" } } },
  subtasks: { select: { status: { select: { type: true } } } },
  checklists: { select: { items: { select: { done: true } } } },
  _count: { select: { attachments: true } },
} as const satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

/**
 * Flattens the join rows to `assignees: [{ id, name, email, avatarColor }]` and `tags: [{ id, name, color }]`,
 * and turns subtasks/checklists/attachments into counts for the card badges. The description is left out
 * (only the task detail endpoint sends it).
 */
export function toTaskDto({ assignees, tags, subtasks, checklists, description, _count, ...task }: TaskRow) {
  const items = checklists.flatMap((c) => c.items);
  return {
    ...task,
    assignees: assignees.map((a) => a.user),
    tags: tags.map((t) => t.tag),
    hasDescription: description !== null,
    subtaskCount: subtasks.length,
    subtaskDoneCount: subtasks.filter((s) => s.status.type === "done").length,
    checklistTotal: items.length,
    checklistDone: items.filter((i) => i.done).length,
    attachmentCount: _count.attachments,
  };
}
