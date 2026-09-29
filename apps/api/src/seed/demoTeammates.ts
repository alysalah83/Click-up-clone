import { randomUUID } from "node:crypto";
import type { MemberRole, Prisma, PrismaClient } from "../generated/prisma/client.js";

/** A Prisma client or an interactive-transaction client (`prisma.$transaction(async (tx) => ...)`). */
export type SeedClient = PrismaClient | Prisma.TransactionClient;

export type SeedDemoTeammatesInput = {
  /** The guest the demo belongs to: owns the teammates (cascade delete) and each workspace. */
  ownerUserId: string;
  /** Workspace (= ClickUp Space) ids; every teammate joins every one of them. */
  workspaceIds: string[];
  /** Tasks to spread assignees over (about 70% get 1-3 assignees). Order makes it deterministic. */
  taskIds: string[];
};

export type SeedDemoTeammatesResult = {
  teammates: { id: string; name: string; avatarColor: string }[];
  assignmentsCount: number;
};

export const DEMO_TEAMMATES = [
  { name: "Maya Chen", avatarColor: "#7b68ee", roles: ["admin", "member"] },
  { name: "Liam Patel", avatarColor: "#0092b8", roles: ["member", "admin"] },
  { name: "Sofia Garcia", avatarColor: "#e17100", roles: ["member", "member"] },
  { name: "Noah Kim", avatarColor: "#008236", roles: ["member", "guest"] },
  { name: "Ava Johnson", avatarColor: "#e7000b", roles: ["guest", "member"] },
  { name: "Ethan Brooks", avatarColor: "#4f39f6", roles: ["member", "member"] },
] as const satisfies readonly { name: string; avatarColor: string; roles: readonly MemberRole[] }[];

/** Small deterministic PRNG (mulberry32), so the same input always seeds the same demo. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds the rows for 6 fake teammates (pure, no queries), so they can join a batched
 * `$transaction([...createMany])`: `demo` users owned by the guest (deleted with it), an owner
 * membership for the guest plus a membership per teammate in every workspace (varied roles),
 * and 1-3 assignees on ~70% of the tasks (the guest is in the pool too, for "assigned to me").
 * Users must be inserted before members and assignees.
 */
export function buildDemoTeammates({ ownerUserId, workspaceIds, taskIds }: SeedDemoTeammatesInput) {
  const teammates = DEMO_TEAMMATES.map((t) => ({ ...t, id: randomUUID() }));

  const users = teammates.map(({ id, name, avatarColor }) => ({
    id,
    name,
    avatarColor,
    role: "demo" as const,
    hasOnBoarded: true,
    demoOwnerId: ownerUserId,
  }));

  const members = workspaceIds.flatMap((workspaceId, wi) => [
    { workspaceId, userId: ownerUserId, role: "owner" as MemberRole },
    ...teammates.map((t) => ({ workspaceId, userId: t.id, role: t.roles[wi % t.roles.length] as MemberRole })),
  ]);

  const pool = [...teammates.map((t) => t.id), ownerUserId];
  const random = prng(taskIds.length * 7919 + workspaceIds.length);
  const assignees: { taskId: string; userId: string }[] = [];
  for (const taskId of taskIds) {
    if (random() >= 0.7) continue;
    const count = 1 + Math.floor(random() * 3);
    const picked = new Set<string>();
    while (picked.size < count) picked.add(pool[Math.floor(random() * pool.length)]!);
    for (const userId of picked) assignees.push({ taskId, userId });
  }

  return { users, members, assignees };
}

/** Same as `buildDemoTeammates`, written with 3 batched `createMany` calls. */
export async function seedDemoTeammates(
  tx: SeedClient,
  input: SeedDemoTeammatesInput,
): Promise<SeedDemoTeammatesResult> {
  const { users, members, assignees } = buildDemoTeammates(input);
  await tx.user.createMany({ data: users });
  await tx.workspaceMember.createMany({ data: members, skipDuplicates: true });
  if (assignees.length > 0) await tx.taskAssignee.createMany({ data: assignees, skipDuplicates: true });

  return {
    teammates: users.map(({ id, name, avatarColor }) => ({ id, name, avatarColor })),
    assignmentsCount: assignees.length,
  };
}
