import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

const content = JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }] });

async function setup() {
  const owner = await signUp();
  const outsider = await signUp();
  const { workspace } = await seedWorkspace(owner.cookie);
  return { owner, outsider, workspaceId: workspace.id };
}

const create = (cookie: string, body: Record<string, unknown>) =>
  api().post("/api/docs").set("Cookie", cookie).send(body);

describe("docs", () => {
  it("creates, reads, updates, lists and deletes a doc", async () => {
    const { owner, workspaceId } = await setup();
    const created = await create(owner.cookie, { workspaceId, title: "Roadmap", icon: "🗺️", content }).expect(201);
    expect(created.body).toMatchObject({ workspaceId, parentId: null, title: "Roadmap", icon: "🗺️", content });
    const id = created.body.id as string;

    const blank = await create(owner.cookie, { workspaceId }).expect(201);
    expect(blank.body).toMatchObject({ title: "", content: "", icon: null });

    const read = await api().get(`/api/docs/${id}`).set("Cookie", owner.cookie).expect(200);
    expect(read.body.content).toBe(content);

    const updated = await api()
      .patch(`/api/docs/${id}`)
      .set("Cookie", owner.cookie)
      .send({ title: "Roadmap Q4", content: "" })
      .expect(200);
    expect(updated.body).toMatchObject({ title: "Roadmap Q4", content: "" });

    const list = await api().get(`/api/docs?workspaceId=${workspaceId}`).set("Cookie", owner.cookie).expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body[0]).not.toHaveProperty("content");

    await api().delete(`/api/docs/${id}`).set("Cookie", owner.cookie).expect(200);
    await api().get(`/api/docs/${id}`).set("Cookie", owner.cookie).expect(404);
  });

  it("nests pages, deletes sub-pages with their parent, and rejects cycles and foreign parents", async () => {
    const { owner, workspaceId } = await setup();
    const other = await seedWorkspace(owner.cookie, "Other");
    const parent = (await create(owner.cookie, { workspaceId, title: "Parent" }).expect(201)).body.id as string;
    const child = (await create(owner.cookie, { workspaceId, parentId: parent, title: "Child" }).expect(201)).body
      .id as string;

    await create(owner.cookie, { workspaceId: other.workspace.id, parentId: parent }).expect(422);
    await api().patch(`/api/docs/${parent}`).set("Cookie", owner.cookie).send({ parentId: child }).expect(422);
    await api().patch(`/api/docs/${parent}`).set("Cookie", owner.cookie).send({ parentId: parent }).expect(422);

    await api().delete(`/api/docs/${parent}`).set("Cookie", owner.cookie).expect(200);
    expect(await prisma.doc.findUnique({ where: { id: child } })).toBeNull();
  });

  it("hides docs and spaces from non-members with 404", async () => {
    const { owner, outsider, workspaceId } = await setup();
    const id = (await create(owner.cookie, { workspaceId, title: "Secret" }).expect(201)).body.id as string;

    await create(outsider.cookie, { workspaceId, title: "Nope" }).expect(404);
    await api().get(`/api/docs?workspaceId=${workspaceId}`).set("Cookie", outsider.cookie).expect(404);
    await api().get(`/api/docs/${id}`).set("Cookie", outsider.cookie).expect(404);
    await api().patch(`/api/docs/${id}`).set("Cookie", outsider.cookie).send({ title: "x" }).expect(404);
    await api().delete(`/api/docs/${id}`).set("Cookie", outsider.cookie).expect(404);

    const all = await api().get("/api/docs").set("Cookie", outsider.cookie).expect(200);
    expect(all.body).toEqual([]);
    expect((await prisma.doc.findUnique({ where: { id } }))?.title).toBe("Secret");
  });

  it("requires a login and valid input", async () => {
    const { owner, workspaceId } = await setup();
    await api().get("/api/docs").expect(401);
    await create(owner.cookie, { workspaceId: "nope" }).expect(422);
    await create(owner.cookie, { workspaceId, title: "x".repeat(201) }).expect(422);
  });

  it("seeds demo docs for a guest in both spaces", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const docs = await prisma.doc.findMany({ where: { createdById: res.body.user.id } });
    expect(docs.length).toBeGreaterThanOrEqual(6);
    expect(new Set(docs.map((d) => d.workspaceId)).size).toBe(2);
    expect(docs.some((d) => d.parentId)).toBe(true);
    for (const d of docs) expect(JSON.parse(d.content).type).toBe("doc");
  });
});
