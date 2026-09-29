import type { Prisma } from "../generated/prisma/client.js";

export const assigneeUserSelect = { id: true, name: true, email: true, avatarColor: true } as const;

/** Every task payload carries its status and its assignees. */
export const taskInclude = {
  status: true,
  assignees: {
    select: { user: { select: assigneeUserSelect } },
    orderBy: { createdAt: "asc" },
  },
} as const satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

/** Flattens the join rows to `assignees: [{ id, name, email, avatarColor }]`. */
export function toTaskDto({ assignees, ...task }: TaskRow) {
  return { ...task, assignees: assignees.map((a) => a.user) };
}
