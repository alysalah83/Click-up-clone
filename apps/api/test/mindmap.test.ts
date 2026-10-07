import { describe, expect, it } from "vitest";
import { MAX_SUBTASK_DEPTH } from "@clickup/shared";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

type TaskBody = { id: string; name: string; parentTaskId: string | null; subtaskCount: number };

describe("mind map: nested subtasks", () => {
  it("nests subtasks up to MAX_SUBTASK_DEPTH and lists them all with subtasks=true", async () => {
    const a = await signUp();
    const ws = await seedWorkspace(a.cookie);
    const top = await createTask(a.cookie, { listId: ws.list.id, statusId: ws.openStatus.id, name: "Top" });

    let parentId = top.id as string;
    const chain: string[] = [];
    for (let depth = 1; depth <= MAX_SUBTASK_DEPTH; depth++) {
      const res = await api()
        .post(`/api/tasks/${parentId}/subtasks`)
        .set("Cookie", a.cookie)
        .send({ name: `Level ${depth}` })
        .expect(201);
      expect(res.body).toMatchObject({ parentTaskId: parentId, listId: ws.list.id, statusId: ws.openStatus.id });
      parentId = res.body.id;
      chain.push(parentId);
    }
    await api()
      .post(`/api/tasks/${parentId}/subtasks`)
      .set("Cookie", a.cookie)
      .send({ name: "Too deep" })
      .expect(422);

    const topOnly = await api().get(`/api/tasks?listId=${ws.list.id}`).set("Cookie", a.cookie).expect(200);
    expect(topOnly.body.map((t: TaskBody) => t.name)).toEqual(["Top"]);

    const all = await api()
      .get(`/api/tasks?listId=${ws.list.id}&subtasks=true`)
      .set("Cookie", a.cookie)
      .expect(200);
    const byName = new Map((all.body as TaskBody[]).map((t) => [t.name, t]));
    expect(byName.size).toBe(1 + MAX_SUBTASK_DEPTH);
    expect(byName.get("Level 2")).toMatchObject({ parentTaskId: chain[0], subtaskCount: 1 });

    // Other users never see them.
    const b = await signUp();
    const other = await api().get(`/api/tasks?subtasks=true`).set("Cookie", b.cookie).expect(200);
    expect(other.body).toEqual([]);

    // Deleting the top-level task removes the whole branch.
    await api().delete(`/api/tasks/${top.id}`).set("Cookie", a.cookie).expect((r) => expect(r.status).toBeLessThan(300));
    expect(await prisma.task.count({ where: { id: { in: chain } } })).toBe(0);
  });

  it("seeds Sprint 14 with subtasks three levels deep", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const guestId = res.body.user.id as string;
    const sprint = await prisma.list.findFirstOrThrow({ where: { userId: guestId, name: "Sprint 14" } });
    const tasks = await prisma.task.findMany({ where: { listId: sprint.id }, select: { id: true, parentTaskId: true } });
    const parentOf = new Map(tasks.map((t) => [t.id, t.parentTaskId]));
    const depth = (id: string) => {
      let d = 0;
      for (let p = parentOf.get(id); p; p = parentOf.get(p)) d++;
      return d;
    };
    const depths = tasks.map((t) => depth(t.id));
    expect(depths.filter((d) => d === 2).length).toBeGreaterThanOrEqual(8);
    expect(depths.filter((d) => d === 3).length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...depths)).toBeLessThanOrEqual(MAX_SUBTASK_DEPTH);
  });
});
