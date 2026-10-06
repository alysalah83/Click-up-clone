import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

const scene = JSON.stringify({ elements: [{ id: "a", type: "rectangle" }], appState: {}, files: {} });

async function setup() {
  const owner = await signUp();
  const outsider = await signUp();
  const { workspace, list } = await seedWorkspace(owner.cookie);
  return { owner, outsider, workspaceId: workspace.id as string, listId: list.id as string };
}

const create = (cookie: string, body: Record<string, unknown>) =>
  api().post("/api/whiteboards").set("Cookie", cookie).send(body);

describe("whiteboards", () => {
  it("creates, reads, renames, saves, lists and deletes a board", async () => {
    const { owner, workspaceId } = await setup();
    const created = await create(owner.cookie, { workspaceId, title: "Brainstorm" }).expect(201);
    expect(created.body).toMatchObject({ workspaceId, title: "Brainstorm", scene: "" });
    const id = created.body.id as string;

    const saved = await api()
      .patch(`/api/whiteboards/${id}`)
      .set("Cookie", owner.cookie)
      .send({ scene, title: "Retro" })
      .expect(200);
    expect(saved.body).toMatchObject({ id, title: "Retro" });
    expect(saved.body).not.toHaveProperty("scene");

    const read = await api().get(`/api/whiteboards/${id}`).set("Cookie", owner.cookie).expect(200);
    expect(read.body.scene).toBe(scene);

    const list = await api()
      .get(`/api/whiteboards?workspaceId=${workspaceId}`)
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).not.toHaveProperty("scene");

    await api().delete(`/api/whiteboards/${id}`).set("Cookie", owner.cookie).expect(200);
    await api().get(`/api/whiteboards/${id}`).set("Cookie", owner.cookie).expect(404);
  });

  it("accepts scenes larger than the global 100kb body limit", async () => {
    const { owner, workspaceId } = await setup();
    const id = (await create(owner.cookie, { workspaceId }).expect(201)).body.id as string;
    const big = JSON.stringify({ elements: [], pad: "x".repeat(300_000) });
    await api().patch(`/api/whiteboards/${id}`).set("Cookie", owner.cookie).send({ scene: big }).expect(200);
    expect((await prisma.whiteboard.findUnique({ where: { id } }))?.scene).toBe(big);
  });

  it("converts a sticky note into a task in a list of the same space", async () => {
    const { owner, workspaceId, listId } = await setup();
    const other = await seedWorkspace(owner.cookie, "Other");
    const id = (await create(owner.cookie, { workspaceId }).expect(201)).body.id as string;

    const res = await api()
      .post(`/api/whiteboards/${id}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ listId, name: "  Dark mode for mobile  " })
      .expect(201);
    expect(res.body).toMatchObject({ name: "Dark mode for mobile", listId });
    const status = await prisma.status.findUniqueOrThrow({ where: { id: res.body.statusId as string } });
    expect(status.listId).toBe(listId);

    await api()
      .post(`/api/whiteboards/${id}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ listId: other.list.id, name: "Wrong space" })
      .expect(422);
    await api().post(`/api/whiteboards/${id}/tasks`).set("Cookie", owner.cookie).send({ listId, name: "" }).expect(422);
  });

  it("hides boards from non-members with 404", async () => {
    const { owner, outsider, workspaceId, listId } = await setup();
    const id = (await create(owner.cookie, { workspaceId, title: "Secret" }).expect(201)).body.id as string;

    await create(outsider.cookie, { workspaceId }).expect(404);
    await api().get(`/api/whiteboards?workspaceId=${workspaceId}`).set("Cookie", outsider.cookie).expect(404);
    await api().get(`/api/whiteboards/${id}`).set("Cookie", outsider.cookie).expect(404);
    await api().patch(`/api/whiteboards/${id}`).set("Cookie", outsider.cookie).send({ title: "x" }).expect(404);
    await api().delete(`/api/whiteboards/${id}`).set("Cookie", outsider.cookie).expect(404);
    await api()
      .post(`/api/whiteboards/${id}/tasks`)
      .set("Cookie", outsider.cookie)
      .send({ listId, name: "x" })
      .expect(404);

    const all = await api().get("/api/whiteboards").set("Cookie", outsider.cookie).expect(200);
    expect(all.body).toEqual([]);
  });

  it("requires a login and valid input", async () => {
    const { owner, workspaceId } = await setup();
    await api().get("/api/whiteboards").expect(401);
    await create(owner.cookie, { workspaceId: "nope" }).expect(422);
    await create(owner.cookie, { workspaceId, title: "x".repeat(201) }).expect(422);
  });

  it("finds boards in search", async () => {
    const { owner, workspaceId } = await setup();
    await create(owner.cookie, { workspaceId, title: "Roadmap brainstorm" }).expect(201);
    const res = await api().get("/api/search?q=brainstorm").set("Cookie", owner.cookie).expect(200);
    expect(res.body.whiteboards).toHaveLength(1);
  });

  it("seeds a skeleton brainstorm board per demo space with a note linked to a real task", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const boards = await prisma.whiteboard.findMany({ where: { createdById: res.body.user.id } });
    expect(boards).toHaveLength(2);
    expect(new Set(boards.map((b) => b.workspaceId)).size).toBe(2);
    for (const board of boards) {
      const parsed = JSON.parse(board.scene) as { skeleton: boolean; elements: { type: string; link?: string }[] };
      expect(parsed.skeleton).toBe(true);
      const notes = parsed.elements.filter((e) => e.type === "rectangle" && "label" in e);
      expect(notes.length).toBeGreaterThanOrEqual(8);
      expect(parsed.elements.some((e) => e.type === "arrow")).toBe(true);
      const link = parsed.elements.find((e) => e.link)?.link;
      const taskId = link?.match(/[?&]task=([^&]+)/)?.[1];
      expect(taskId).toBeTruthy();
      const task = await prisma.task.findUnique({ where: { id: taskId! }, select: { list: { select: { workspaceId: true } } } });
      expect(task?.list.workspaceId).toBe(board.workspaceId);
    }
  });
});
