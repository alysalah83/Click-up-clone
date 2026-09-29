import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

describe("lists", () => {
  it("creates a list with open/active/done default statuses in order", async () => {
    const a = await signUp();
    const { list, statuses } = await seedWorkspace(a.cookie);
    expect(list.workspaceId).toBeDefined();
    expect(statuses.map((s) => [s.name, s.type])).toEqual([
      ["to do", "open"],
      ["in progress", "active"],
      ["complete", "done"],
    ]);
  });

  it("refuses to create a list in another user's workspace", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(b.cookie);
    await api()
      .post("/api/lists")
      .set("Cookie", a.cookie)
      .send({ name: "sneaky", workspaceId: workspace.id })
      .expect(404);
    expect(await prisma.list.count({ where: { workspaceId: workspace.id } })).toBe(1);
  });

  it("PATCH renames but never moves a list to another workspace", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    const other = await seedWorkspace(b.cookie);
    const res = await api()
      .patch(`/api/lists/${list.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "Renamed", workspaceId: other.workspace.id, userId: b.user.id })
      .expect(200);
    expect(res.body).toMatchObject({ name: "Renamed", workspaceId: list.workspaceId, userId: a.user.id });
  });

  it("another user's list is 404 for read, update, delete and workspace listing", async () => {
    const a = await signUp();
    const b = await signUp();
    const { list, workspace } = await seedWorkspace(b.cookie);
    await api().get(`/api/lists/${list.id}`).set("Cookie", a.cookie).expect(404);
    await api().patch(`/api/lists/${list.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/lists/${list.id}`).set("Cookie", a.cookie).expect(404);
    await api().get(`/api/lists/workspace/${workspace.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("/latest returns a fixed shape and ignores ?select=", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    const res = await api().get("/api/lists/latest?select=user").set("Cookie", a.cookie).expect(200);
    expect(res.body).toEqual({ id: list.id, name: "Sprint 1", workspaceId: list.workspaceId });
  });

  it("count, workspace listing and belong-to", async () => {
    const a = await signUp();
    const { list, workspace } = await seedWorkspace(a.cookie);
    const other = await seedWorkspace(a.cookie, "Second");
    expect((await api().get("/api/lists?count=true").set("Cookie", a.cookie)).body).toBe(2);
    const inWorkspace = await api().get(`/api/lists/workspace/${workspace.id}`).set("Cookie", a.cookie);
    expect(inWorkspace.body.map((l: { id: string }) => l.id)).toEqual([list.id]);
    const yes = await api().get(`/api/lists/${list.id}/belong-to/${workspace.id}`).set("Cookie", a.cookie);
    const no = await api().get(`/api/lists/${list.id}/belong-to/${other.workspace.id}`).set("Cookie", a.cookie);
    expect([yes.body, no.body]).toEqual([true, false]);
  });

  it("GET ?withCounts=true returns totalTasksCount and completedTasksCount per list", async () => {
    const a = await signUp();
    const { list, openStatus, doneStatus } = await seedWorkspace(a.cookie);
    await createTask(a.cookie, { listId: list.id, statusId: openStatus.id });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id });
    await createTask(a.cookie, { listId: list.id, statusId: doneStatus.id });

    const res = await api().get("/api/lists?withCounts=true").set("Cookie", a.cookie).expect(200);
    const found = res.body.find((l: { id: string }) => l.id === list.id);
    expect(found).toMatchObject({ totalTasksCount: 3, completedTasksCount: 2 });
  });

  it("GET without ?withCounts= keeps the current shape (no count keys)", async () => {
    const a = await signUp();
    await seedWorkspace(a.cookie);
    const res = await api().get("/api/lists").set("Cookie", a.cookie).expect(200);
    expect(res.body[0].totalTasksCount).toBeUndefined();
    expect(res.body[0].completedTasksCount).toBeUndefined();
  });

  it("DELETE removes the list and its tasks", async () => {
    const a = await signUp();
    const { list } = await seedWorkspace(a.cookie);
    await api().delete(`/api/lists/${list.id}`).set("Cookie", a.cookie).expect(200);
    expect(await prisma.list.count({ where: { id: list.id } })).toBe(0);
  });
});
