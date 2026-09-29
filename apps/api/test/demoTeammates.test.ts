import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { seedDemoTeammates } from "../src/seed/demoTeammates.js";
import { deleteStaleGuests } from "../src/services/guestCleanup.service.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

async function guestWithTasks(taskCount: number) {
  // A plain sign-up (no demo seed of its own), turned into a guest for the cleanup check.
  const { cookie, user } = await signUp();
  const guestId = user.id;
  await prisma.user.update({ where: { id: guestId }, data: { role: "guest" } });
  const product = await seedWorkspace(cookie, "Product");
  const marketing = await seedWorkspace(cookie, "Marketing");
  await prisma.task.createMany({
    data: Array.from({ length: taskCount }, (_, i) => {
      const space = i % 2 ? marketing : product;
      return { name: `Task ${i}`, userId: guestId, listId: space.list.id, statusId: space.openStatus.id };
    }),
  });
  const tasks = await prisma.task.findMany({ where: { userId: guestId }, orderBy: { name: "asc" } });
  return { cookie, guestId, workspaceIds: [product.workspace.id, marketing.workspace.id], tasks };
}

describe("seedDemoTeammates", () => {
  it("creates teammates as members and assigns them across most tasks, in one transaction", async () => {
    const { cookie, guestId, workspaceIds, tasks } = await guestWithTasks(40);

    const result = await prisma.$transaction((tx) =>
      seedDemoTeammates(tx, { ownerUserId: guestId, workspaceIds, taskIds: tasks.map((t) => t.id) }),
    );

    expect(result.teammates.map((t) => t.name)).toContain("Maya Chen");
    expect(await prisma.user.count({ where: { role: "demo", demoOwnerId: guestId } })).toBe(6);
    for (const workspaceId of workspaceIds) {
      const members = await prisma.workspaceMember.findMany({ where: { workspaceId } });
      expect(members).toHaveLength(7);
      expect(members.filter((m) => m.role === "owner").map((m) => m.userId)).toEqual([guestId]);
      expect(new Set(members.map((m) => m.role)).size).toBeGreaterThan(2);
    }

    const assigned = await prisma.task.count({ where: { userId: guestId, assignees: { some: {} } } });
    expect(assigned / tasks.length).toBeGreaterThan(0.5);
    expect(assigned / tasks.length).toBeLessThan(0.9);
    expect(await prisma.taskAssignee.count()).toBe(result.assignmentsCount);

    const people = await api().get("/api/members").set("Cookie", cookie).expect(200);
    expect(people.body).toHaveLength(7);
    const listed = await api().get("/api/tasks").set("Cookie", cookie).expect(200);
    expect(listed.body.some((t: { assignees: unknown[] }) => t.assignees.length > 0)).toBe(true);

    // The daily guest cleanup removes the teammates with their guest.
    await prisma.user.update({ where: { id: guestId }, data: { createdAt: new Date(0) } });
    expect(await deleteStaleGuests()).toBe(1);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.workspaceMember.count()).toBe(0);
    expect(await prisma.taskAssignee.count()).toBe(0);
  });
});
