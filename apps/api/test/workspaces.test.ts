import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

const avatar = { icon: "circleDotted", color: "violet" };

describe("workspaces", () => {
  it("lists only the caller's workspaces, and count=true returns a number", async () => {
    const a = await signUp();
    const b = await signUp();
    await seedWorkspace(a.cookie, "A-space");
    await seedWorkspace(b.cookie, "B-space");

    const res = await api().get("/api/workspaces").set("Cookie", a.cookie).expect(200);
    expect(res.body.map((w: { name: string }) => w.name)).toEqual(["A-space"]);
    expect(res.body[0].avatar).toMatchObject(avatar);

    const count = await api().get("/api/workspaces?count=true").set("Cookie", a.cookie).expect(200);
    expect(count.body).toBe(1);
  });

  it("GET /:id is 404 for another user's or a missing workspace, and 422 for a bad id", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(b.cookie);
    await api().get(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).expect(404);
    await api().get(`/api/workspaces/${crypto.randomUUID()}`).set("Cookie", a.cookie).expect(404);
    await api().get("/api/workspaces/abc").set("Cookie", a.cookie).expect(422);
  });

  it("PATCH ignores userId/avatarId in the body (mass assignment)", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(a.cookie);

    const res = await api()
      .patch(`/api/workspaces/${workspace.id}`)
      .set("Cookie", a.cookie)
      .send({ name: "Renamed", userId: b.user.id, avatarId: crypto.randomUUID(), avatar: { color: "sky" } })
      .expect(200);

    expect(res.body).toMatchObject({ name: "Renamed", avatar: { icon: "circleDotted", color: "sky" } });
    const row = await prisma.workspace.findUniqueOrThrow({ where: { id: workspace.id } });
    expect(row.userId).toBe(a.user.id);
    expect(row.avatarId).toBe(workspace.avatarId);
  });

  it("PATCH and DELETE on another user's workspace are 404", async () => {
    const a = await signUp();
    const b = await signUp();
    const { workspace } = await seedWorkspace(b.cookie);
    await api().patch(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).expect(404);
  });

  it("DELETE removes the workspace, its avatar, lists and tasks", async () => {
    const a = await signUp();
    const { workspace, list } = await seedWorkspace(a.cookie);
    await api().delete(`/api/workspaces/${workspace.id}`).set("Cookie", a.cookie).expect(204);
    expect(await prisma.workspace.count()).toBe(0);
    expect(await prisma.avatar.count({ where: { id: workspace.avatarId } })).toBe(0);
    expect(await prisma.list.count({ where: { id: list.id } })).toBe(0);
  });

  it("GET ?include=lists returns each workspace with its lists ordered by createdAt asc", async () => {
    const a = await signUp();
    const { workspace, list: list1 } = await seedWorkspace(a.cookie, "Eng");
    const list2 = await api()
      .post("/api/lists")
      .set("Cookie", a.cookie)
      .send({ name: "Sprint 2", workspaceId: workspace.id })
      .expect(201);

    const res = await api().get("/api/workspaces?include=lists").set("Cookie", a.cookie).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(workspace.id);
    expect(res.body[0].lists.map((l: { id: string }) => l.id)).toEqual([list1.id, list2.body.id]);
  });

  it("GET ?include=lists never includes another user's workspaces or lists", async () => {
    const a = await signUp();
    const b = await signUp();
    const seededA = await seedWorkspace(a.cookie, "A-space");
    await seedWorkspace(b.cookie, "B-space");

    const res = await api().get("/api/workspaces?include=lists").set("Cookie", a.cookie).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("A-space");
    expect(res.body[0].lists.map((l: { id: string }) => l.id)).toEqual([seededA.list.id]);
  });

  it("GET without ?include= keeps the current shape (no lists key)", async () => {
    const a = await signUp();
    await seedWorkspace(a.cookie);
    const res = await api().get("/api/workspaces").set("Cookie", a.cookie).expect(200);
    expect(res.body[0].lists).toBeUndefined();
  });

  it("POST /flow creates workspace, list, 3 defaults + 1 custom status and a task, owned by the caller", async () => {
    const a = await signUp();
    const b = await signUp();
    const res = await api()
      .post("/api/workspaces/flow")
      .set("Cookie", a.cookie)
      .send({
        data: {
          workspace: { name: "Eng", avatar },
          list: { name: "Sprint", userId: b.user.id },
          status: { name: "review", icon: "inProgress", iconColor: "sky", bgColor: "sky" },
          task: { name: "First task", priority: "high", userId: b.user.id },
        },
      })
      .expect(201);

    expect(res.body.task).toMatchObject({ name: "First task", priority: "high", userId: a.user.id });
    expect(res.body.task.status).toMatchObject({ name: "review", type: "active", order: 300 });
    expect(res.body.list.userId).toBe(a.user.id);
    expect(await prisma.status.count({ where: { listId: res.body.list.id } })).toBe(4);
  });
});
