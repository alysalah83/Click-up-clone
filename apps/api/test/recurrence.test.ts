import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { nextOccurrenceDate, nextOccurrenceDates } from "../src/services/recurrence.service.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

const utc = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

describe("next occurrence dates", () => {
  it("adds 1 day, 7 days, 1 month or N days", () => {
    expect(nextOccurrenceDate(utc("2026-10-01"), "daily")).toEqual(utc("2026-10-02"));
    expect(nextOccurrenceDate(utc("2026-10-28"), "weekly")).toEqual(utc("2026-11-04"));
    expect(nextOccurrenceDate(utc("2026-10-15"), "monthly")).toEqual(utc("2026-11-15"));
    expect(nextOccurrenceDate(utc("2026-10-15"), "custom", 10)).toEqual(utc("2026-10-25"));
    expect(nextOccurrenceDate(utc("2026-10-15"), "none")).toEqual(utc("2026-10-15"));
  });

  it("clamps monthly to the last day and rolls over the year", () => {
    expect(nextOccurrenceDate(utc("2026-01-31"), "monthly")).toEqual(utc("2026-02-28"));
    expect(nextOccurrenceDate(utc("2028-01-31"), "monthly")).toEqual(utc("2028-02-29"));
    expect(nextOccurrenceDate(utc("2026-12-31"), "monthly")).toEqual(utc("2027-01-31"));
  });

  it("shifts both dates and leaves missing ones empty", () => {
    expect(nextOccurrenceDates({ startDate: utc("2026-10-01"), endDate: utc("2026-10-03") }, "weekly")).toEqual({
      startDate: utc("2026-10-08"),
      endDate: utc("2026-10-10"),
    });
    expect(nextOccurrenceDates({ startDate: null, endDate: null }, "daily")).toEqual({
      startDate: null,
      endDate: null,
    });
  });
});

describe("recurring tasks", () => {
  async function setup() {
    const user = await signUp();
    const ws = await seedWorkspace(user.cookie);
    const task = await createTask(user.cookie, {
      listId: ws.list.id,
      statusId: ws.openStatus.id,
      name: "Weekly report",
      priority: "high",
    });
    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", user.cookie)
      .send({
        startDate: "2026-10-05T12:00:00.000Z",
        endDate: "2026-10-07T12:00:00.000Z",
        recurrenceType: "weekly",
      })
      .expect(200);
    return { user, ws, task };
  }

  const setStatus = (cookie: string, taskId: string, statusId: string) =>
    api().patch(`/api/tasks/${taskId}`).set("Cookie", cookie).send({ statusId }).expect(200);

  it("creates the next occurrence when moved to a done status, and clears the rule on the old one", async () => {
    const { user, ws, task } = await setup();
    await prisma.taskAssignee.create({ data: { taskId: task.id, userId: user.user.id } });
    const tag = await prisma.tag.create({ data: { workspaceId: ws.workspace.id, name: "ops", color: "violet" } });
    await prisma.taskTag.create({ data: { taskId: task.id, tagId: tag.id } });

    const res = await setStatus(user.cookie, task.id, ws.doneStatus.id);
    expect(res.body.recurrenceType).toBe("none");

    const tasks = await prisma.task.findMany({
      where: { listId: ws.list.id },
      include: { assignees: true, tags: true },
    });
    expect(tasks).toHaveLength(2);
    const next = tasks.find((t) => t.id !== task.id)!;
    expect(next).toMatchObject({
      name: "Weekly report",
      priority: "high",
      statusId: ws.openStatus.id,
      recurrenceType: "weekly",
    });
    expect(next.startDate).toEqual(utc("2026-10-12"));
    expect(next.endDate).toEqual(utc("2026-10-14"));
    expect(next.assignees.map((a) => a.userId)).toEqual([user.user.id]);
    expect(next.tags.map((t) => t.tagId)).toEqual([tag.id]);

    const activity = await prisma.activity.findMany({ where: { taskId: task.id, type: "recurred" } });
    expect(activity).toHaveLength(1);
  });

  it("copies checklists (unchecked) and direct subtasks (open status, dates shifted) to the next occurrence", async () => {
    const { user, ws, task } = await setup();
    const active = ws.statuses.find((s) => s.type === "active")!;
    await prisma.checklist.create({
      data: {
        taskId: task.id,
        name: "Steps",
        items: {
          createMany: {
            data: [
              { text: "Collect numbers", done: true, order: 0 },
              { text: "Send", done: false, order: 1 },
            ],
          },
        },
      },
    });
    await prisma.task.create({
      data: {
        name: "Draft",
        userId: user.user.id,
        listId: ws.list.id,
        statusId: active.id,
        parentTaskId: task.id,
        endDate: utc("2026-10-06"),
      },
    });
    await prisma.task.create({
      data: { name: "Review", userId: user.user.id, listId: ws.list.id, statusId: ws.doneStatus.id, parentTaskId: task.id },
    });

    await setStatus(user.cookie, task.id, ws.doneStatus.id);

    const next = await prisma.task.findFirstOrThrow({
      where: { listId: ws.list.id, parentTaskId: null, id: { not: task.id } },
      include: {
        checklists: { include: { items: { orderBy: { order: "asc" } } } },
        subtasks: { orderBy: { name: "asc" } },
      },
    });
    expect(next.checklists).toHaveLength(1);
    expect(next.checklists[0]!.name).toBe("Steps");
    expect(next.checklists[0]!.items.map((i) => [i.text, i.done])).toEqual([
      ["Collect numbers", false],
      ["Send", false],
    ]);
    expect(next.subtasks.map((s) => s.name)).toEqual(["Draft", "Review"]);
    expect(next.subtasks.every((s) => s.statusId === ws.openStatus.id)).toBe(true);
    expect(next.subtasks[0]!.endDate).toEqual(utc("2026-10-13"));
    expect(next.subtasks[1]!.startDate).toBeNull();
    expect(next.subtasks[1]!.endDate).toBeNull();
    // The originals are untouched.
    expect(await prisma.task.count({ where: { parentTaskId: task.id } })).toBe(2);
    expect(await prisma.checklistItem.count({ where: { checklist: { taskId: task.id }, done: true } })).toBe(1);
  });

  it("does not spawn for non-done statuses, nor again when the completed task is reopened and closed", async () => {
    const { user, ws, task } = await setup();
    const active = ws.statuses.find((s) => s.type === "active")!;
    await setStatus(user.cookie, task.id, active.id);
    expect(await prisma.task.count({ where: { listId: ws.list.id } })).toBe(1);

    await setStatus(user.cookie, task.id, ws.doneStatus.id);
    await setStatus(user.cookie, task.id, ws.openStatus.id);
    await setStatus(user.cookie, task.id, ws.doneStatus.id);
    expect(await prisma.task.count({ where: { listId: ws.list.id } })).toBe(2);
  });

  it("works through the bulk update too, with a custom interval", async () => {
    const user = await signUp();
    const ws = await seedWorkspace(user.cookie);
    const task = await createTask(user.cookie, { listId: ws.list.id, statusId: ws.openStatus.id });
    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", user.cookie)
      .send({ endDate: "2026-10-01T12:00:00.000Z", recurrenceType: "custom", recurrenceInterval: 3 })
      .expect(200);
    await api()
      .patch("/api/tasks/bulk")
      .set("Cookie", user.cookie)
      .send({ tasksId: [task.id], updatedFields: { statusId: ws.doneStatus.id } })
      .expect(204);
    const next = await prisma.task.findFirstOrThrow({ where: { listId: ws.list.id, id: { not: task.id } } });
    expect(next.endDate).toEqual(utc("2026-10-04"));
    expect(next.recurrenceInterval).toBe(3);
  });

  it("rejects an invalid interval", async () => {
    const { user, task } = await setup();
    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", user.cookie)
      .send({ recurrenceType: "custom", recurrenceInterval: 0 })
      .expect(422);
  });
});
