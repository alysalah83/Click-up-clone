import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { seedGuest } from "../src/services/user.service.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

type LinkJson = {
  id: string;
  token: string;
  resourceType: "list" | "doc";
  resourceId: string;
  isActive: boolean;
  viewCount: number;
  lastViewedAt: string | null;
};

const linkPath = (type: "list" | "doc", id: string) => `/api/share-links/${type}/${id}`;
const publicGet = (path: string) => api().get(`/api/public/share/${path}`).set("X-Client-Ip", "203.0.113.9");

const richDoc = (text: string) => ({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text, marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] },
    { type: "rawHtml", attrs: { html: "<script>x</script>" } },
  ],
});

async function sharedList() {
  const owner = await signUp({ name: "Owner Person" });
  const outsider = await signUp();
  const space = await seedWorkspace(owner.cookie, "Marketing");
  const task = await createTask(owner.cookie, { listId: space.list.id, statusId: space.openStatus.id, name: "Launch page" });
  await prisma.task.update({ where: { id: task.id }, data: { description: richDoc("Read the brief"), points: 3 } });
  await prisma.taskAssignee.create({ data: { taskId: task.id, userId: owner.user.id } });
  const tag = await prisma.tag.create({ data: { workspaceId: space.workspace.id, name: "web", color: "#7b68ee" } });
  await prisma.taskTag.create({ data: { taskId: task.id, tagId: tag.id } });
  await prisma.task.create({
    data: { name: "Hero copy", userId: owner.user.id, listId: space.list.id, statusId: space.doneStatus.id, parentTaskId: task.id },
  });
  const link = (await api().put(linkPath("list", space.list.id)).set("Cookie", owner.cookie).send({ isActive: true }).expect(200))
    .body.link as LinkJson;
  return { owner, outsider, space, task, link };
}

describe("share links", () => {
  it("members manage one link per list; outsiders and anonymous callers cannot", async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const viewer = await signUp();
    const space = await seedWorkspace(owner.cookie);
    await prisma.workspaceMember.create({ data: { workspaceId: space.workspace.id, userId: viewer.user.id, role: "guest" } });

    expect((await api().get(linkPath("list", space.list.id)).set("Cookie", owner.cookie).expect(200)).body).toEqual({ link: null, canManage: true });
    await api().get(linkPath("list", space.list.id)).expect(401);
    await api().get(linkPath("list", space.list.id)).set("Cookie", outsider.cookie).expect(404);
    await api().put(linkPath("list", space.list.id)).set("Cookie", outsider.cookie).send({ isActive: true }).expect(404);
    await api().put(linkPath("list", space.list.id)).set("Cookie", viewer.cookie).send({ isActive: true }).expect(403);
    await api().put(`/api/share-links/folder/${space.list.id}`).set("Cookie", owner.cookie).send({ isActive: true }).expect(422);

    const on = (await api().put(linkPath("list", space.list.id)).set("Cookie", owner.cookie).send({ isActive: true }).expect(200))
      .body.link as LinkJson;
    expect(on).toMatchObject({ resourceType: "list", resourceId: space.list.id, isActive: true, viewCount: 0 });
    expect(on.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    // Guests of the space can see the link, not change it.
    expect((await api().get(linkPath("list", space.list.id)).set("Cookie", viewer.cookie).expect(200)).body).toMatchObject({
      link: { token: on.token },
      canManage: false,
    });

    const off = (await api().put(linkPath("list", space.list.id)).set("Cookie", owner.cookie).send({ isActive: false }).expect(200))
      .body.link as LinkJson;
    expect(off).toMatchObject({ id: on.id, token: on.token, isActive: false });
    await publicGet(on.token).expect(404);

    // Turning it back on keeps the URL; a reset replaces it and the old one stops working.
    await api().put(linkPath("list", space.list.id)).set("Cookie", owner.cookie).send({ isActive: true }).expect(200);
    await publicGet(on.token).expect(200);
    const reset = (await api().post(`${linkPath("list", space.list.id)}/reset`).set("Cookie", owner.cookie).expect(200)).body
      .link as LinkJson;
    expect(reset).toMatchObject({ id: on.id, isActive: true, viewCount: 0, lastViewedAt: null });
    expect(reset.token).not.toBe(on.token);
    await publicGet(on.token).expect(404);
    await publicGet(reset.token).expect(200);
    expect(await prisma.shareLink.count()).toBe(1);
  });

  it("serves a read-only list without emails or private ids, and counts views", async () => {
    const { owner, space, task, link } = await sharedList();

    const res = await publicGet(link.token).expect(200);
    expect(res.body).toMatchObject({ resourceType: "list", name: "Sprint 1", spaceName: "Marketing" });
    expect(res.body.statuses.map((s: { type: string }) => s.type)).toEqual(["open", "active", "done"]);
    expect(res.body.tasks).toEqual([
      expect.objectContaining({
        id: task.id,
        name: "Launch page",
        statusId: space.openStatus.id,
        points: 3,
        assignees: [{ name: "Owner Person", avatarColor: expect.stringMatching(/^#/) }],
        tags: [{ name: "web", color: "#7b68ee" }],
        subtaskCount: 1,
        subtaskDoneCount: 1,
      }),
    ]);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain(owner.credentials.email);
    expect(raw).not.toContain(space.workspace.id);
    expect(raw).not.toContain(owner.user.id);
    expect(raw).not.toContain("description");

    await publicGet(link.token).expect(200);
    const after = (await api().get(linkPath("list", space.list.id)).set("Cookie", owner.cookie).expect(200)).body.link as LinkJson;
    expect(after.viewCount).toBe(2);
    expect(after.lastViewedAt).not.toBeNull();

    // A task's detail: sanitized description and subtasks. Opening tasks does not count views.
    const detail = await publicGet(`${link.token}/tasks/${task.id}`).expect(200);
    expect(detail.body.description).toEqual({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Read the brief" }] }] });
    expect(detail.body.subtasks).toEqual([expect.objectContaining({ name: "Hero copy", statusId: space.doneStatus.id })]);
    expect(JSON.stringify(detail.body)).not.toContain(owner.credentials.email);
    expect((await prisma.shareLink.findUniqueOrThrow({ where: { id: link.id } })).viewCount).toBe(2);
  });

  it("only exposes tasks of the shared list, and unknown tokens are 404", async () => {
    const { owner, link } = await sharedList();
    const other = await seedWorkspace(owner.cookie, "Private");
    const secret = await createTask(owner.cookie, { listId: other.list.id, statusId: other.openStatus.id, name: "Secret" });

    await publicGet(`${link.token}/tasks/${secret.id}`).expect(404);
    await publicGet(`${link.token}/tasks/not-a-uuid`).expect(422);
    await publicGet("A".repeat(22)).expect(404);
    await publicGet("short").expect(422);
    await publicGet(`${link.token}/pages/${secret.id}`).expect(404);
  });

  it("serves a doc with its sub-pages only, sanitized", async () => {
    const owner = await signUp({ name: "Doc Author" });
    const space = await seedWorkspace(owner.cookie);
    const create = async (title: string, parentId?: string) =>
      (
        await api()
          .post("/api/docs")
          .set("Cookie", owner.cookie)
          .send({ workspaceId: space.workspace.id, title, parentId, content: JSON.stringify(richDoc(`${title} body`)) })
          .expect(201)
      ).body as { id: string };
    const parent = await create("Handbook");
    const shared = await create("Launch plan", parent.id);
    const child = await create("Page spec", shared.id);
    const grandchild = await create("Copy deck", child.id);
    const sibling = await create("Salaries", parent.id);

    const link = (await api().put(linkPath("doc", shared.id)).set("Cookie", owner.cookie).send({ isActive: true }).expect(200)).body
      .link as LinkJson;
    const res = await publicGet(link.token).expect(200);
    expect(res.body).toMatchObject({
      resourceType: "doc",
      id: shared.id,
      parentId: null,
      title: "Launch plan",
      authorName: "Doc Author",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Launch plan body" }] }] },
    });
    expect(res.body.pages).toEqual([
      { id: child.id, parentId: shared.id, title: "Page spec", icon: null },
      { id: grandchild.id, parentId: child.id, title: "Copy deck", icon: null },
    ]);
    expect(JSON.stringify(res.body)).not.toContain(parent.id);

    const page = await publicGet(`${link.token}/pages/${grandchild.id}`).expect(200);
    expect(page.body).toMatchObject({ id: grandchild.id, title: "Copy deck" });
    await publicGet(`${link.token}/pages/${shared.id}`).expect(200);
    await publicGet(`${link.token}/pages/${sibling.id}`).expect(404);
    await publicGet(`${link.token}/pages/${parent.id}`).expect(404);
    await publicGet(`${link.token}/tasks/${child.id}`).expect(404);

    // Deleting the doc removes its link.
    await api().delete(`/api/docs/${shared.id}`).set("Cookie", owner.cookie).expect(200);
    expect(await prisma.shareLink.count()).toBe(0);
    await publicGet(link.token).expect(404);
  });

  it("deleting a list or its space removes the link", async () => {
    const { owner, space, link } = await sharedList();
    await prisma.list.delete({ where: { id: space.list.id } });
    expect(await prisma.shareLink.count()).toBe(0);
    await publicGet(link.token).expect(404);

    const again = await seedWorkspace(owner.cookie);
    await api().put(linkPath("list", again.list.id)).set("Cookie", owner.cookie).send({ isActive: true }).expect(200);
    await prisma.workspace.delete({ where: { id: again.workspace.id } });
    expect(await prisma.shareLink.count()).toBe(0);
  });

  it("the demo guest has a shared list and a shared doc with views", async () => {
    const { user } = await seedGuest();
    const links = await prisma.shareLink.findMany({
      where: { createdById: user.id },
      include: { list: { select: { name: true } }, doc: { select: { title: true } } },
      orderBy: { resourceType: "asc" },
    });
    expect(links.map((l) => [l.resourceType, l.list?.name ?? l.doc?.title, l.isActive])).toEqual([
      ["list", "Q4 Launch Campaign", true],
      ["doc", "Q4 launch plan", true],
    ]);
    expect(links.every((l) => l.viewCount > 0)).toBe(true);

    const list = await publicGet(links[0]!.token).expect(200);
    expect(list.body.tasks.length).toBeGreaterThan(10);
    expect(list.body.tasks.some((t: { assignees: unknown[] }) => t.assignees.length > 0)).toBe(true);
    const doc = await publicGet(links[1]!.token).expect(200);
    expect(doc.body.pages.map((p: { title: string }) => p.title)).toEqual(["Launch page spec"]);
    expect(doc.body.content).not.toBeNull();
  });
});
