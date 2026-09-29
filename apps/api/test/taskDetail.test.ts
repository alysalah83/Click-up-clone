import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

describe("task detail", () => {
  it("returns the nested task page and 404s for non-members", async () => {
    const a = await signUp();
    const b = await signUp();
    const ws = await seedWorkspace(a.cookie);
    const task = await createTask(a.cookie, {
      listId: ws.list.id,
      statusId: ws.openStatus.id,
      name: "Parent",
    });

    const description = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
    };
    await api()
      .patch(`/api/tasks/${task.id}/description`)
      .set("Cookie", a.cookie)
      .send({ description })
      .expect(200);
    await api()
      .post(`/api/tasks/${task.id}/subtasks`)
      .set("Cookie", a.cookie)
      .send({ name: "Child" })
      .expect(201);
    const checklist = await api()
      .post(`/api/tasks/${task.id}/checklists`)
      .set("Cookie", a.cookie)
      .send({ name: "QA" })
      .expect(201);
    const item = await api()
      .post(`/api/checklists/${checklist.body.id}/items`)
      .set("Cookie", a.cookie)
      .send({ text: "Check Safari" })
      .expect(201);
    await api()
      .patch(`/api/checklist-items/${item.body.id}`)
      .set("Cookie", a.cookie)
      .send({ done: true })
      .expect(200);
    const tag = await api()
      .post(`/api/workspaces/${ws.workspace.id}/tags`)
      .set("Cookie", a.cookie)
      .send({ name: "Frontend", color: "#2b7fff" })
      .expect(201);
    await api()
      .put(`/api/tasks/${task.id}/tags/${tag.body.id}`)
      .set("Cookie", a.cookie)
      .expect(204);

    const res = await api()
      .get(`/api/tasks/${task.id}`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(res.body).toMatchObject({
      id: task.id,
      description,
      list: { id: ws.list.id },
      workspace: { id: ws.workspace.id },
      parentTask: null,
      subtasks: [{ name: "Child", parentTaskId: task.id }],
      checklists: [
        { name: "QA", items: [{ text: "Check Safari", done: true }] },
      ],
      tags: [{ name: "frontend", color: "#2b7fff" }],
      subtaskCount: 1,
      checklistTotal: 1,
      checklistDone: 1,
    });
    const types = res.body.activity.map((a: { type: string }) => a.type);
    expect([...types].sort()).toEqual([
      "checklist_item_done",
      "created",
      "description",
      "subtask_added",
      "tag_added",
    ]);
    const times = res.body.activity.map((a: { createdAt: string }) =>
      Date.parse(a.createdAt),
    );
    expect(times).toEqual([...times].sort((x, y) => y - x)); // newest first
    expect(res.body.activity[0].actor).toMatchObject({
      id: a.user.id,
      name: "Test User",
    });

    // A second description save within 5 minutes does not add another entry.
    await api()
      .patch(`/api/tasks/${task.id}/description`)
      .set("Cookie", a.cookie)
      .send({ description })
      .expect(200);
    expect(
      await prisma.activity.count({
        where: { taskId: task.id, type: "description" },
      }),
    ).toBe(1);

    await api()
      .get(`/api/tasks/${task.id}`)
      .set("Cookie", b.cookie)
      .expect(404);
    await api()
      .post(`/api/tasks/${task.id}/subtasks`)
      .set("Cookie", b.cookie)
      .send({ name: "x" })
      .expect(404);
    await api()
      .patch(`/api/checklist-items/${item.body.id}`)
      .set("Cookie", b.cookie)
      .send({ done: false })
      .expect(404);
    await api()
      .get(`/api/workspaces/${ws.workspace.id}/tags`)
      .set("Cookie", b.cookie)
      .expect(404);
  });

  it("records a status change in the activity log", async () => {
    const a = await signUp();
    const ws = await seedWorkspace(a.cookie);
    const task = await createTask(a.cookie, {
      listId: ws.list.id,
      statusId: ws.openStatus.id,
    });

    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", a.cookie)
      .send({ statusId: ws.doneStatus.id })
      .expect(200);

    const activity = await prisma.activity.findFirst({
      where: { taskId: task.id, type: "status" },
    });
    expect(activity).toMatchObject({
      actorId: a.user.id,
      data: { from: ws.openStatus.name, to: ws.doneStatus.name },
    });
  });

  it("keeps subtasks out of the top-level task list and counts", async () => {
    const a = await signUp();
    const ws = await seedWorkspace(a.cookie);
    const parent = await createTask(a.cookie, {
      listId: ws.list.id,
      statusId: ws.openStatus.id,
      name: "Parent",
    });
    await api()
      .post(`/api/tasks/${parent.id}/subtasks`)
      .set("Cookie", a.cookie)
      .send({ name: "Child" })
      .expect(201);

    const list = await api()
      .get(`/api/tasks?listId=${ws.list.id}`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(list.body.map((t: { name: string }) => t.name)).toEqual(["Parent"]);
    expect(list.body[0].subtaskCount).toBe(1);
    const count = await api()
      .get(`/api/tasks?listId=${ws.list.id}&count=true`)
      .set("Cookie", a.cookie)
      .expect(200);
    expect(count.body).toBe(1);
  });
});
