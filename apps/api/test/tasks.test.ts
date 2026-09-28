import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

describe("tasks", () => {
  it("rejects a status from a different list (422) and another user's list (404)", async () => {
    const a = await signUp();
    const b = await signUp();
    const one = await seedWorkspace(a.cookie);
    const two = await seedWorkspace(a.cookie, "Second");
    const foreign = await seedWorkspace(b.cookie);

    await api()
      .post("/api/tasks")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: one.list.id, statusId: two.openStatus.id })
      .expect(422);
    await api()
      .post("/api/tasks")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: foreign.list.id, statusId: foreign.openStatus.id })
      .expect(404);
    await api()
      .post("/api/tasks")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: one.list.id, statusId: foreign.openStatus.id })
      .expect(422);
  });

  it("update cannot move a task to another list's status or change its list/owner", async () => {
    const a = await signUp();
    const one = await seedWorkspace(a.cookie);
    const two = await seedWorkspace(a.cookie, "Second");
    const task = await createTask(a.cookie, { listId: one.list.id, statusId: one.openStatus.id });

    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", a.cookie)
      .send({ statusId: two.openStatus.id })
      .expect(422);

    const res = await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "Renamed", listId: two.list.id, userId: crypto.randomUUID(), statusId: one.doneStatus.id })
      .expect(200);
    expect(res.body).toMatchObject({ name: "Renamed", listId: one.list.id, statusId: one.doneStatus.id });
    expect(res.body.status.type).toBe("done");
  });

  it("another user's task is 404 for update and delete", async () => {
    const a = await signUp();
    const b = await signUp();
    const foreign = await seedWorkspace(b.cookie);
    const task = await createTask(b.cookie, { listId: foreign.list.id, statusId: foreign.openStatus.id });
    await api().patch(`/api/tasks/${task.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/tasks/${task.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("bulk delete only deletes tasks in the list named in the URL", async () => {
    const a = await signUp();
    const one = await seedWorkspace(a.cookie);
    const two = await seedWorkspace(a.cookie, "Second");
    const inOne = await createTask(a.cookie, { listId: one.list.id, statusId: one.openStatus.id });
    const inTwo = await createTask(a.cookie, { listId: two.list.id, statusId: two.openStatus.id });

    const res = await api()
      .delete(`/api/tasks/${one.list.id}/bulk`)
      .set("Cookie", a.cookie)
      .send([inOne.id, inTwo.id])
      .expect(200);

    expect(res.body.deletedCount).toBe(1);
    expect(await prisma.task.findUnique({ where: { id: inTwo.id } })).not.toBeNull();
  });

  it("bulk update is all-or-nothing when any id is not the caller's", async () => {
    const a = await signUp();
    const b = await signUp();
    const mine = await seedWorkspace(a.cookie);
    const theirs = await seedWorkspace(b.cookie);
    const t1 = await createTask(a.cookie, { listId: mine.list.id, statusId: mine.openStatus.id });
    const t2 = await createTask(b.cookie, { listId: theirs.list.id, statusId: theirs.openStatus.id });

    await api()
      .patch("/api/tasks/bulk")
      .set("Cookie", a.cookie)
      .send({ tasksId: [t1.id, t2.id], updatedFields: { priority: "urgent" } })
      .expect(404);
    expect((await prisma.task.findUniqueOrThrow({ where: { id: t1.id } })).priority).toBe("none");

    await api()
      .patch("/api/tasks/bulk")
      .set("Cookie", a.cookie)
      .send({ tasksId: [t1.id], updatedFields: { priority: "urgent" } })
      .expect(204);
    expect((await prisma.task.findUniqueOrThrow({ where: { id: t1.id } })).priority).toBe("urgent");
  });

  it("bulk endpoints validate their bodies", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    await api().patch("/api/tasks/bulk").set("Cookie", a.cookie).send({ tasksId: [], updatedFields: {} }).expect(422);
    await api().delete(`/api/tasks/${list.id}/bulk`).set("Cookie", a.cookie).send([]).expect(422);
  });

  it("GET ignores ?select=, accepts empty sort params and paginates with X-Next-Cursor", async () => {
    const a = await signUp();
    const { list, openStatus } = await seedWorkspace(a.cookie);
    for (const name of ["one", "two", "three"])
      await createTask(a.cookie, { listId: list.id, statusId: openStatus.id, name });

    const page1 = await api()
      .get(`/api/tasks?listId=${list.id}&createdAt=asc&status=&select=user&limit=2`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(page1.body).toHaveLength(2);
    expect(page1.body[0]).not.toHaveProperty("user");
    expect(page1.body[0].status).toMatchObject({ type: "open" });
    const cursor = page1.headers["x-next-cursor"];
    expect(cursor).toEqual(expect.any(String));

    const page2 = await api()
      .get(`/api/tasks?listId=${list.id}&createdAt=asc&limit=2&cursor=${cursor}`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(page2.body.map((t: { name: string }) => t.name)).toEqual(["three"]);
    expect(page2.headers["x-next-cursor"]).toBeUndefined();

    const count = await api().get(`/api/tasks?listId=${list.id}&count=true`).set("Cookie", a.cookie);
    expect(count.body).toBe(3);
  });

  it("complete/total and priority counts", async () => {
    const a = await signUp();
    const { list, openStatus, doneStatus } = await seedWorkspace(a.cookie);
    await createTask(a.cookie, { listId: list.id, statusId: openStatus.id, priority: "high" });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id, priority: "high" });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id });

    const totals = await api()
      .get(`/api/tasks/${list.id}/completeAndTotalTasksCounts`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(totals.body).toEqual({ totalTasksCount: 3, completedTasksCount: 2 });

    const priorities = await api().get("/api/tasks/priorityCounts").set("Cookie", a.cookie).expect(200);
    expect(priorities.body).toEqual({ high: 2, none: 1 });
  });
});
