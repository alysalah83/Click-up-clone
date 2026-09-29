import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

const style = { icon: "inProgress", iconColor: "sky", bgColor: "sky" };

describe("statuses", () => {
  it("creates a custom active status after the last non-done status", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    const res = await api()
      .post("/api/statuses")
      .set("Cookie", a.cookie)
      .send({ name: "review", listId: list.id, ...style })
      .expect(201);
    expect(res.body).toMatchObject({ name: "review", type: "active", isDefault: false, order: 300 });
  });

  it("refuses to add a status to another user's list", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(b.cookie);
    await api()
      .post("/api/statuses")
      .set("Cookie", a.cookie)
      .send({ name: "x", listId: list.id, ...style })
      .expect(404);
  });

  it("renames a status and reports duplicate names as 409", async () => {
    const a = await signUp();
    const { openStatus } = await seedWorkspace(a.cookie);
    const res = await api()
      .patch(`/api/statuses/${openStatus.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "backlog", iconColor: "sky", order: 5 })
      .expect(200);
    expect(res.body).toMatchObject({ name: "backlog", iconColor: "sky", order: 100 });
    await api()
      .patch(`/api/statuses/${openStatus.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "complete" })
      .expect(409);
  });

  it("default statuses cannot be deleted", async () => {
    const a = await signUp();
    const { openStatus } = await seedWorkspace(a.cookie);
    await api().delete(`/api/statuses/${openStatus.id}`).set("Cookie", a.cookie).expect(403);
  });

  it("deleting a custom status moves its tasks to the open status instead of deleting them", async () => {
    const a = await signUp();
    const { list, openStatus } = await seedWorkspace(a.cookie);
    const custom = await api()
      .post("/api/statuses")
      .set("Cookie", a.cookie)
      .send({ name: "review", listId: list.id, ...style })
      .expect(201);
    const task = await createTask(a.cookie, { listId: list.id, statusId: custom.body.id });

    const res = await api().delete(`/api/statuses/${custom.body.id}`).set("Cookie", a.cookie).expect(200);

    expect(res.body).toMatchObject({ id: custom.body.id, movedTasksCount: 1 });
    const moved = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(moved.statusId).toBe(openStatus.id);
  });

  it("another user's status is 404 for rename and delete", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(b.cookie);
    const custom = await api()
      .post("/api/statuses")
      .set("Cookie", b.cookie)
      .send({ name: "review", listId: list.id, ...style })
      .expect(201);
    await api().patch(`/api/statuses/${custom.body.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/statuses/${custom.body.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("GET /list/:listId is 404 for another user's list", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(b.cookie);
    await api().get(`/api/statuses/list/${list.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("statusCounts counts tasks per status name", async () => {
    const a = await signUp();
    const { list, openStatus, doneStatus } = await seedWorkspace(a.cookie);
    await createTask(a.cookie, { listId: list.id, statusId: openStatus.id });
    await createTask(a.cookie, { listId: list.id, statusId: openStatus.id });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id });

    const res = await api().get("/api/statuses/statusCounts").set("Cookie", a.cookie).expect(200);
    expect(res.body).toEqual({
      totalCount: 3,
      "to doCount": 2,
      "in progressCount": 0,
      completeCount: 1,
      colors: {
        "to do": "neutral",
        "in progress": "violet",
        complete: "emerald",
      },
    });
  });
});
