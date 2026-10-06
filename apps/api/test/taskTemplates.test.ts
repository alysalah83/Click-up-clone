import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

type Template = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  workspace: { id: string; name: string };
  snapshot: {
    name: string;
    priority: string;
    points: number | null;
    dueInDays: number | null;
    tags: { name: string; color: string }[];
    subtasks: { name: string; priority: string }[];
    checklists: { name: string; items: string[] }[];
    description: unknown;
  };
};

const DESCRIPTION = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Steps" }] }] };

/** A task with a description, points, a due date, a tag, two subtasks and a checklist (one item done). */
async function richTask() {
  const owner = await signUp();
  const outsider = await signUp();
  const space = await seedWorkspace(owner.cookie);
  const task = await createTask(owner.cookie, { listId: space.list.id, statusId: space.openStatus.id, name: "Login bug", priority: "high" });
  const created = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
  const due = new Date(Date.UTC(created.createdAt.getUTCFullYear(), created.createdAt.getUTCMonth(), created.createdAt.getUTCDate() + 3, 12));
  await api().patch(`/api/tasks/${task.id}`).set("Cookie", owner.cookie).send({ points: 3, endDate: due, startDate: due }).expect(200);
  await api().patch(`/api/tasks/${task.id}/description`).set("Cookie", owner.cookie).send({ description: DESCRIPTION }).expect(200);
  for (const name of ["Write failing test", "Fix"])
    await api().post(`/api/tasks/${task.id}/subtasks`).set("Cookie", owner.cookie).send({ name }).expect(201);
  const checklist = await api().post(`/api/tasks/${task.id}/checklists`).set("Cookie", owner.cookie).send({ name: "Triage" }).expect(201);
  const first = await api().post(`/api/checklists/${checklist.body.id}/items`).set("Cookie", owner.cookie).send({ text: "Reproduce" }).expect(201);
  await api().post(`/api/checklists/${checklist.body.id}/items`).set("Cookie", owner.cookie).send({ text: "Add logs" }).expect(201);
  await api().patch(`/api/checklist-items/${first.body.id}`).set("Cookie", owner.cookie).send({ done: true }).expect(200);
  const tag = await api().post(`/api/workspaces/${space.workspace.id}/tags`).set("Cookie", owner.cookie).send({ name: "bug", color: "red" }).expect(201);
  await api().put(`/api/tasks/${task.id}/tags/${tag.body.id}`).set("Cookie", owner.cookie).expect(204);
  return { owner, outsider, space, task };
}

const saveAsTemplate = (cookie: string, body: Record<string, unknown>) =>
  api().post("/api/task-templates/from-task").set("Cookie", cookie).send(body);

describe("task templates", () => {
  it("snapshots a task with its subtasks, checklists, tags and relative due date", async () => {
    const { owner, outsider, space, task } = await richTask();
    await saveAsTemplate(outsider.cookie, { taskId: task.id, name: "Nope" }).expect(404);

    const res = await saveAsTemplate(owner.cookie, { taskId: task.id, name: " Bug report ", description: "Triage" }).expect(201);
    const template = res.body as Template;
    expect(template).toMatchObject({
      name: "Bug report",
      description: "Triage",
      workspaceId: space.workspace.id,
      workspace: { id: space.workspace.id, name: "Engineering" },
      snapshot: {
        name: "Login bug",
        priority: "high",
        points: 3,
        dueInDays: 3,
        tags: [{ name: "bug", color: "red" }],
        subtasks: [
          { name: "Write failing test", priority: "none" },
          { name: "Fix", priority: "none" },
        ],
        checklists: [{ name: "Triage", items: ["Reproduce", "Add logs"] }],
        description: DESCRIPTION,
      },
    });

    const listed = await api().get("/api/task-templates").set("Cookie", owner.cookie).expect(200);
    expect(listed.body.map((t: Template) => t.id)).toEqual([template.id]);
    await api().get(`/api/task-templates?workspaceId=${space.workspace.id}`).set("Cookie", outsider.cookie).expect(404);
    expect((await api().get("/api/task-templates").set("Cookie", outsider.cookie).expect(200)).body).toEqual([]);
  });

  it("creates a task from a template in one call, with fresh subtasks, unchecked items, tags and activity", async () => {
    const { owner, space, task } = await richTask();
    const template = (await saveAsTemplate(owner.cookie, { taskId: task.id, name: "Bug report" }).expect(201)).body as Template;

    // Apply in another space of the same user: the "bug" tag is created there.
    const other = await seedWorkspace(owner.cookie, "Marketing");
    const before = Date.now();
    const res = await api()
      .post(`/api/task-templates/${template.id}/apply`)
      .set("Cookie", owner.cookie)
      .send({ listId: other.list.id, statusId: other.statuses[1]!.id, name: "Checkout fails" })
      .expect(201);
    expect(res.body).toMatchObject({
      name: "Checkout fails",
      listId: other.list.id,
      statusId: other.statuses[1]!.id,
      priority: "high",
      points: 3,
      subtaskCount: 2,
      checklistTotal: 2,
      checklistDone: 0,
      tags: [{ name: "bug", color: "red" }],
      hasDescription: true,
    });
    const due = new Date(res.body.endDate as string);
    expect(due.getUTCHours()).toBe(12);
    const days = Math.round((due.getTime() - before) / 86_400_000);
    expect(days).toBeGreaterThanOrEqual(2);
    expect(days).toBeLessThanOrEqual(4);

    const detail = await api().get(`/api/tasks/${res.body.id}`).set("Cookie", owner.cookie).expect(200);
    expect(detail.body.description).toEqual(DESCRIPTION);
    expect(detail.body.subtasks.map((s: { name: string; statusId: string }) => [s.name, s.statusId])).toEqual([
      ["Write failing test", other.openStatus.id],
      ["Fix", other.openStatus.id],
    ]);
    expect(detail.body.checklists[0].items.map((i: { text: string; done: boolean }) => [i.text, i.done])).toEqual([
      ["Reproduce", false],
      ["Add logs", false],
    ]);
    expect(detail.body.activity[0]).toMatchObject({ type: "created_from_template", data: { name: "Bug report" } });
    expect(await prisma.tag.count({ where: { workspaceId: other.workspace.id, name: "bug" } })).toBe(1);

    // Applying again reuses the tag; the source task is untouched.
    await api()
      .post(`/api/task-templates/${template.id}/apply`)
      .set("Cookie", owner.cookie)
      .send({ listId: other.list.id, statusId: other.openStatus.id })
      .expect(201);
    expect(await prisma.tag.count({ where: { workspaceId: other.workspace.id, name: "bug" } })).toBe(1);
    expect(await prisma.task.count({ where: { parentTaskId: task.id } })).toBe(2);
    expect(await prisma.task.count({ where: { listId: space.list.id, parentTaskId: null } })).toBe(1);
  });

  it("checks access on apply, rename and delete", async () => {
    const { owner, outsider, space, task } = await richTask();
    const template = (await saveAsTemplate(owner.cookie, { taskId: task.id, name: "Bug report" }).expect(201)).body as Template;
    const theirs = await seedWorkspace(outsider.cookie);

    // A status from another list, someone else's list, someone else's template.
    await api()
      .post(`/api/task-templates/${template.id}/apply`)
      .set("Cookie", owner.cookie)
      .send({ listId: space.list.id, statusId: theirs.openStatus.id })
      .expect(422);
    await api()
      .post(`/api/task-templates/${template.id}/apply`)
      .set("Cookie", owner.cookie)
      .send({ listId: theirs.list.id, statusId: theirs.openStatus.id })
      .expect(404);
    await api()
      .post(`/api/task-templates/${template.id}/apply`)
      .set("Cookie", outsider.cookie)
      .send({ listId: theirs.list.id, statusId: theirs.openStatus.id })
      .expect(404);
    await api().patch(`/api/task-templates/${template.id}`).set("Cookie", outsider.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/task-templates/${template.id}`).set("Cookie", outsider.cookie).expect(404);

    const renamed = await api()
      .patch(`/api/task-templates/${template.id}`)
      .set("Cookie", owner.cookie)
      .send({ name: "Bug", description: "Short" })
      .expect(200);
    expect(renamed.body).toMatchObject({ name: "Bug", description: "Short" });
    await api().patch(`/api/task-templates/${template.id}`).set("Cookie", owner.cookie).send({}).expect(422);
    await api().delete(`/api/task-templates/${template.id}`).set("Cookie", owner.cookie).expect(200);
    expect(await prisma.taskTemplate.count({ where: { id: template.id } })).toBe(0);

    // Deleting the space removes its templates.
    await saveAsTemplate(owner.cookie, { taskId: task.id, name: "Again" }).expect(201);
    await prisma.workspace.delete({ where: { id: space.workspace.id } });
    expect(await prisma.taskTemplate.count({ where: { workspaceId: space.workspace.id } })).toBe(0);
  });

  it("seeds Bug report, Feature and Meeting notes for a guest", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;
    const templates = (await api().get("/api/task-templates").set("Cookie", cookie).expect(200)).body as Template[];
    expect(templates.map((t) => t.name)).toEqual(["Bug report", "Feature", "Meeting notes"]);
    const [bug, feature, meeting] = templates;
    expect(bug!.workspace.name).toBe("Product");
    expect(bug!.snapshot).toMatchObject({
      priority: "high",
      tags: [{ name: "bug" }],
      checklists: [{ name: "Triage", items: ["Reproduce", "Add logs", "Assign owner", "Link to sprint"] }],
      subtasks: [{ name: "Write failing test" }, { name: "Fix" }, { name: "Verify on staging" }],
    });
    expect(feature!.snapshot.subtasks.map((s) => s.name)).toEqual(["Design", "Build API", "Build UI", "Write docs"]);
    expect(feature!.snapshot.checklists[0]!.name).toBe("Definition of done");
    expect(meeting!.snapshot).toMatchObject({ dueInDays: 1 });
    expect(meeting!.snapshot.checklists.map((c) => c.name)).toEqual(["Before the meeting", "After the meeting"]);

    // Applying the seeded bug template in the guest's Product sprint reuses the seeded "bug" tag.
    const list = await prisma.list.findFirstOrThrow({
      where: { workspaceId: bug!.workspaceId, sprintState: "active" },
      include: { status: { orderBy: { order: "asc" } } },
    });
    const applied = await api()
      .post(`/api/task-templates/${bug!.id}/apply`)
      .set("Cookie", cookie)
      .send({ listId: list.id, statusId: list.status[0]!.id })
      .expect(201);
    expect(applied.body).toMatchObject({ name: "Bug report", subtaskCount: 3, checklistTotal: 4 });
    expect(await prisma.tag.count({ where: { workspaceId: bug!.workspaceId, name: "bug" } })).toBe(1);
  });
});
