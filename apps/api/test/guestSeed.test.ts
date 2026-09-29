import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api } from "./helpers.js";

describe("guest demo workspace", () => {
  it("seeds 2 spaces, 4 lists, 16 statuses and ~80 tasks, readable only by that guest", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const guestId = res.body.user.id as string;
    expect(res.body.user.hasOnBoarded).toBe(true);

    const where = { userId: guestId };
    expect(await prisma.workspace.count({ where })).toBe(2);
    expect(await prisma.avatar.count({ where: { workspace: { some: where } } })).toBe(2);
    expect(await prisma.list.count({ where })).toBe(4);
    expect(await prisma.status.count({ where })).toBe(16);
    const tasks = await prisma.task.findMany({ where, include: { status: true } });
    expect(tasks.length).toBeGreaterThanOrEqual(70);
    expect(tasks.length).toBeLessThanOrEqual(100);
    for (const task of tasks) expect(task.status.listId).toBe(task.listId);
    expect(new Set(tasks.map((t) => t.priority)).size).toBe(5);

    const landing = await prisma.list.findUnique({ where: { id: res.body.landingListId } });
    expect(landing).toMatchObject({ name: "Sprint Board", userId: guestId });

    // Normal endpoints serve it, in template order; another guest cannot see it.
    const workspaces = await api()
      .get("/api/workspaces?include=lists")
      .set("Cookie", `token=${res.body.token}`)
      .expect(200);
    expect(workspaces.body.map((w: { name: string }) => w.name)).toEqual(["Product", "Marketing"]);
    expect(workspaces.body[0].lists.map((l: { name: string }) => l.name)).toEqual([
      "Sprint Board",
      "Bug Tracker",
    ]);
    const other = await api().post("/api/users/register/guest").expect(201);
    await api()
      .get(`/api/statuses/list/${res.body.landingListId}`)
      .set("Cookie", `token=${other.body.token}`)
      .expect(404);
  });
});
