import { describe, expect, it } from "vitest";
import { Prisma } from "../src/generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";
import { api } from "./helpers.js";

describe("guest demo workspace", () => {
  it("seeds 2 spaces, 8 lists (5 sprints), 32 statuses and ~110 tasks, readable only by that guest", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const guestId = res.body.user.id as string;
    expect(res.body.user.hasOnBoarded).toBe(true);

    const where = { userId: guestId };
    expect(await prisma.workspace.count({ where })).toBe(2);
    expect(
      await prisma.avatar.count({ where: { workspace: { some: where } } }),
    ).toBe(2);
    expect(await prisma.list.count({ where })).toBe(8);
    expect(await prisma.status.count({ where })).toBe(32);
    const tasks = await prisma.task.findMany({
      where,
      include: { status: true },
    });
    const topLevel = tasks.filter((t) => !t.parentTaskId);
    expect(topLevel.length).toBeGreaterThanOrEqual(70);
    expect(topLevel.length).toBeLessThanOrEqual(130);
    for (const task of tasks) expect(task.status.listId).toBe(task.listId);
    expect(new Set(tasks.map((t) => t.priority)).size).toBe(5);

    // Fake teammates: members of both spaces (guest is owner) and assigned across most tasks.
    expect(
      await prisma.user.count({
        where: { role: "demo", demoOwnerId: guestId },
      }),
    ).toBe(6);
    expect(
      await prisma.workspaceMember.count({
        where: { userId: guestId, role: "owner" },
      }),
    ).toBe(2);
    expect(
      await prisma.workspaceMember.count({ where: { workspace: where } }),
    ).toBe(14);
    const assigned = await prisma.task.count({
      where: { ...where, assignees: { some: {} } },
    });
    expect(assigned / tasks.length).toBeGreaterThan(0.5);
    expect(tasks.length - topLevel.length).toBeGreaterThanOrEqual(16);

    // Step 3: rich descriptions, subtasks (hidden from top-level views), checklists, tags, activity.
    expect(
      await prisma.task.count({
        where: { ...where, description: { not: Prisma.DbNull } },
      }),
    ).toBeGreaterThanOrEqual(15);
    const parents = await prisma.task.count({
      where: { ...where, subtasks: { some: {} } },
    });
    expect(parents).toBeGreaterThanOrEqual(8);
    expect(
      tasks
        .filter((t) => t.parentTaskId)
        .every((t) => t.status.listId === t.listId),
    ).toBe(true);
    expect(
      await prisma.checklist.count({ where: { task: where } }),
    ).toBeGreaterThanOrEqual(6);
    expect(
      await prisma.checklistItem.count({
        where: { checklist: { task: where }, done: true },
      }),
    ).toBeGreaterThan(0);
    expect(
      await prisma.tag.count({ where: { workspace: where } }),
    ).toBeGreaterThanOrEqual(12);
    expect(
      await prisma.task.count({ where: { ...where, tags: { some: {} } } }),
    ).toBeGreaterThanOrEqual(40);
    const tasksWithActivity = await prisma.activity.groupBy({
      by: ["taskId"],
      where: { task: where },
    });
    expect(tasksWithActivity.length).toBeGreaterThanOrEqual(20);
    expect(
      await prisma.activity.count({
        where: { task: where, actor: { role: "demo" } },
      }),
    ).toBeGreaterThan(40);

    const landing = await prisma.list.findUnique({
      where: { id: res.body.landingListId },
    });
    expect(landing).toMatchObject({ name: "Sprint 14", userId: guestId, sprintState: "active" });

    // Normal endpoints serve it, in template order; another guest cannot see it.
    const workspaces = await api()
      .get("/api/workspaces?include=lists")
      .set("Cookie", `token=${res.body.token}`)
      .expect(200);
    expect(workspaces.body.map((w: { name: string }) => w.name)).toEqual([
      "Product",
      "Marketing",
    ]);
    expect(
      workspaces.body[0].lists.map((l: { name: string }) => l.name),
    ).toEqual(["Sprint 11", "Sprint 12", "Sprint 13", "Sprint 14", "Sprint 15", "Bug Tracker"]);
    const other = await api().post("/api/users/register/guest").expect(201);
    await api()
      .get(`/api/statuses/list/${res.body.landingListId}`)
      .set("Cookie", `token=${other.body.token}`)
      .expect(404);
  });
});

describe("guest demo: time tracking and recurring tasks", () => {
  it("seeds time entries for teammates and the guest, and two recurring tasks", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const guestId = res.body.user.id as string;
    const entries = await prisma.timeEntry.findMany({ where: { task: { userId: guestId } } });
    expect(entries.length).toBeGreaterThanOrEqual(20);
    expect(entries.every((e) => e.endedAt && e.durationSec)).toBe(true);
    expect(entries.some((e) => e.userId === guestId)).toBe(true);
    expect(new Set(entries.map((e) => e.userId)).size).toBe(7);
    expect(await prisma.task.count({ where: { userId: guestId, recurrenceType: { not: "none" } } })).toBe(2);
  });
});
