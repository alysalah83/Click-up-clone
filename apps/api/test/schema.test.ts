import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { defaultStatusesFor } from "../src/consts/status.const.js";

async function seedTask() {
  const user = await prisma.user.create({ data: { role: "guest" } });
  const avatar = await prisma.avatar.create({ data: { icon: "circleDotted", color: "violet" } });
  const workspace = await prisma.workspace.create({ data: { name: "W", userId: user.id, avatarId: avatar.id } });
  const list = await prisma.list.create({
    data: {
      name: "L",
      userId: user.id,
      workspaceId: workspace.id,
      status: { createMany: { data: defaultStatusesFor(user.id) } },
    },
    include: { status: true },
  });
  const open = list.status.find((s) => s.type === "open")!;
  const task = await prisma.task.create({
    data: { name: "T", userId: user.id, listId: list.id, statusId: open.id },
  });
  return { list, open, task };
}

describe("status model", () => {
  it("default statuses are one open, one active and one done, all marked default", async () => {
    const { list } = await seedTask();
    const shape = list.status
      .sort((a, b) => a.order - b.order)
      .map((s) => [s.order, s.type, s.isDefault]);
    expect(shape).toEqual([
      [100, "open", true],
      [200, "active", true],
      [100000, "done", true],
    ]);
  });

  it("the database refuses to delete a status that still has tasks", async () => {
    const { open, task } = await seedTask();
    await expect(prisma.status.delete({ where: { id: open.id } })).rejects.toThrow();
    expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull();
  });

  it("deleting a list still removes its statuses and tasks", async () => {
    const { list } = await seedTask();
    await prisma.list.delete({ where: { id: list.id } });
    expect(await prisma.status.count({ where: { listId: list.id } })).toBe(0);
    expect(await prisma.task.count({ where: { listId: list.id } })).toBe(0);
  });
});
