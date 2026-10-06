import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

async function setup() {
  const owner = await signUp();
  const outsider = await signUp();
  const space = await seedWorkspace(owner.cookie);
  return { owner, outsider, space, workspaceId: space.workspace.id };
}

type Target = { id: string; type: string; progress: number; doneCount: number; tasks: { id: string; done: boolean }[] };
type Goal = { id: string; name: string; progress: number; owner: { id: string } | null; targets: Target[] };

const createGoal = (cookie: string, body: Record<string, unknown>) =>
  api().post("/api/goals").set("Cookie", cookie).send(body);

describe("goals", () => {
  it("creates a goal owned by its creator, edits, lists and deletes it", async () => {
    const { owner, workspaceId } = await setup();
    const created = await createGoal(owner.cookie, {
      workspaceId,
      name: "  Grow signups ",
      dueDate: "2026-12-31T12:00:00.000Z",
    }).expect(201);
    expect(created.body).toMatchObject({
      name: "Grow signups",
      color: "violet",
      progress: 0,
      targets: [],
      owner: { id: owner.user.id },
      dueDate: "2026-12-31T12:00:00.000Z",
    });
    const id = created.body.id as string;

    const patched = await api()
      .patch(`/api/goals/${id}`)
      .set("Cookie", owner.cookie)
      .send({ name: "Grow weekly signups", color: "amber", ownerId: null, dueDate: null })
      .expect(200);
    expect(patched.body).toMatchObject({ name: "Grow weekly signups", color: "amber", owner: null, dueDate: null });

    const list = await api().get(`/api/goals?workspaceId=${workspaceId}`).set("Cookie", owner.cookie).expect(200);
    expect(list.body.map((g: Goal) => g.id)).toEqual([id]);

    await api().delete(`/api/goals/${id}`).set("Cookie", owner.cookie).expect(200);
    await api().get(`/api/goals/${id}`).set("Cookie", owner.cookie).expect(404);
  });

  it("computes number, true/false and task target progress live", async () => {
    const { owner, workspaceId, space } = await setup();
    const id = (await createGoal(owner.cookie, { workspaceId, name: "Launch" }).expect(201)).body.id as string;
    const tasks = await Promise.all(
      [1, 2, 3, 4].map((n) => createTask(owner.cookie, { listId: space.list.id, statusId: space.openStatus.id, name: `T${n}` })),
    );

    const num = await api()
      .post(`/api/goals/${id}/targets`)
      .set("Cookie", owner.cookie)
      .send({ name: "Signups", type: "number", currentValue: 340, targetValue: 500 })
      .expect(201);
    expect(num.body.progress).toBeCloseTo(0.68);
    const numId = (num.body as Goal).targets[0]!.id;

    const flag = await api()
      .post(`/api/goals/${id}/targets`)
      .set("Cookie", owner.cookie)
      .send({ name: "Referral live", type: "boolean" })
      .expect(201);
    const flagId = (flag.body as Goal).targets[1]!.id;
    expect(flag.body.progress).toBeCloseTo(0.34);

    const withTasks = await api()
      .post(`/api/goals/${id}/targets`)
      .set("Cookie", owner.cookie)
      .send({ name: "Ship it", type: "tasks", taskIds: tasks.slice(0, 2).map((t) => t.id) })
      .expect(201);
    const taskTarget = (withTasks.body as Goal).targets[2]!;
    expect(taskTarget).toMatchObject({ type: "tasks", progress: 0, doneCount: 0 });

    const linked = await api()
      .post(`/api/goals/${id}/targets/${taskTarget.id}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ taskIds: [tasks[2]!.id, tasks[3]!.id, tasks[0]!.id] })
      .expect(200);
    expect((linked.body as Goal).targets[2]!.tasks).toHaveLength(4);

    // Completing a task anywhere moves the goal: no stored counter.
    await api().patch(`/api/tasks/${tasks[0]!.id}`).set("Cookie", owner.cookie).send({ statusId: space.doneStatus.id }).expect(200);
    await api()
      .patch(`/api/goals/${id}/targets/${flagId}`)
      .set("Cookie", owner.cookie)
      .send({ currentValue: 1 })
      .expect(200);
    const after = (await api().get(`/api/goals/${id}`).set("Cookie", owner.cookie).expect(200)).body as Goal;
    expect(after.targets[2]).toMatchObject({ progress: 0.25, doneCount: 1 });
    expect(after.targets[1]!.progress).toBe(1);
    expect(after.progress).toBeCloseTo((0.68 + 1 + 0.25) / 3);

    const unlinked = await api()
      .delete(`/api/goals/${id}/targets/${taskTarget.id}/tasks/${tasks[3]!.id}`)
      .set("Cookie", owner.cookie)
      .expect(200);
    expect((unlinked.body as Goal).targets[2]!.progress).toBeCloseTo(1 / 3);

    await api()
      .patch(`/api/goals/${id}/targets/${numId}`)
      .set("Cookie", owner.cookie)
      .send({ currentValue: 500, name: "Weekly signups" })
      .expect(200);
    const removed = await api().delete(`/api/goals/${id}/targets/${flagId}`).set("Cookie", owner.cookie).expect(200);
    expect((removed.body as Goal).targets.map((t) => t.progress)).toEqual([1, 1 / 3]);

    const taskGoals = await api().get(`/api/tasks/${tasks[0]!.id}/goals`).set("Cookie", owner.cookie).expect(200);
    expect(taskGoals.body).toEqual([expect.objectContaining({ id, name: "Launch" })]);
  });

  it("only links tasks and owners from the goal's space", async () => {
    const { owner, outsider, workspaceId } = await setup();
    const other = await seedWorkspace(owner.cookie, "Other");
    const foreign = await createTask(owner.cookie, { listId: other.list.id, statusId: other.openStatus.id });
    const id = (await createGoal(owner.cookie, { workspaceId, name: "G" }).expect(201)).body.id as string;

    await api()
      .post(`/api/goals/${id}/targets`)
      .set("Cookie", owner.cookie)
      .send({ name: "T", type: "tasks", taskIds: [foreign.id] })
      .expect(422);
    const target = (
      await api().post(`/api/goals/${id}/targets`).set("Cookie", owner.cookie).send({ name: "T", type: "number" }).expect(201)
    ).body.targets[0].id as string;
    await api()
      .post(`/api/goals/${id}/targets/${target}/tasks`)
      .set("Cookie", owner.cookie)
      .send({ taskIds: [foreign.id] })
      .expect(422);
    await api().patch(`/api/goals/${id}`).set("Cookie", owner.cookie).send({ ownerId: outsider.user.id }).expect(422);
    await api().post(`/api/goals/${id}/targets`).set("Cookie", owner.cookie).send({ name: "x", type: "percent" }).expect(422);
  });

  it("hides goals from non-members with 404", async () => {
    const { owner, outsider, workspaceId } = await setup();
    const id = (await createGoal(owner.cookie, { workspaceId, name: "Secret" }).expect(201)).body.id as string;

    await createGoal(outsider.cookie, { workspaceId, name: "x" }).expect(404);
    await api().get(`/api/goals/${id}`).set("Cookie", outsider.cookie).expect(404);
    await api().patch(`/api/goals/${id}`).set("Cookie", outsider.cookie).send({ name: "x" }).expect(404);
    await api().delete(`/api/goals/${id}`).set("Cookie", outsider.cookie).expect(404);
    await api().get(`/api/goals?workspaceId=${workspaceId}`).set("Cookie", outsider.cookie).expect(404);
    expect((await api().get("/api/goals").set("Cookie", outsider.cookie).expect(200)).body).toEqual([]);
  });

  it("searches goals and narrows task search to one space", async () => {
    const { owner, workspaceId, space } = await setup();
    const other = await seedWorkspace(owner.cookie, "Other");
    await createTask(owner.cookie, { listId: space.list.id, statusId: space.openStatus.id, name: "Rocket launch" });
    await createTask(owner.cookie, { listId: other.list.id, statusId: other.openStatus.id, name: "Rocket fuel" });
    await createGoal(owner.cookie, { workspaceId, name: "Rocket goal" }).expect(201);

    const all = (await api().get("/api/search?q=rocket").set("Cookie", owner.cookie).expect(200)).body;
    expect(all.tasks).toHaveLength(2);
    expect(all.goals).toEqual([expect.objectContaining({ name: "Rocket goal" })]);
    const narrowed = (
      await api().get(`/api/search?q=rocket&workspaceId=${workspaceId}`).set("Cookie", owner.cookie).expect(200)
    ).body;
    expect(narrowed.tasks).toEqual([expect.objectContaining({ name: "Rocket launch", list: { name: "Sprint 1", workspaceId } })]);
  });
});

describe("guest demo goals", () => {
  it("seeds three goals with varied progress; completing a sprint task moves the sprint goal", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;
    const goals = (await api().get("/api/goals").set("Cookie", cookie).expect(200)).body as Goal[];
    expect(goals.map((g) => g.name)).toEqual([
      "Launch v2.0 by end of Q4",
      "Grow weekly signups to 500",
      "Ship Sprint 14 commitments",
    ]);
    const [launch, signups, sprint] = goals as [Goal, Goal, Goal];
    expect(launch.progress).toBeCloseTo(0.3625);
    expect(signups.progress).toBeCloseTo((0.68 + 1 + 0.35) / 3);
    expect(sprint.progress).toBeGreaterThan(0.35);
    expect(sprint.progress).toBeLessThan(0.55);
    expect(new Set(goals.map((g) => g.owner?.id)).size).toBe(3);
    expect(launch.targets[0]!.tasks).toHaveLength(8);
    expect(launch.targets[0]!.doneCount).toBe(3);

    const sprintTasks = sprint.targets[0]!.tasks;
    expect(sprintTasks.length).toBeGreaterThanOrEqual(20);
    const open = sprintTasks.find((t) => !t.done)!;
    const task = await prisma.task.findUniqueOrThrow({ where: { id: open.id } });
    const done = await prisma.status.findFirstOrThrow({ where: { listId: task.listId, type: "done" } });
    await api().patch(`/api/tasks/${open.id}`).set("Cookie", cookie).send({ statusId: done.id }).expect(200);
    const after = (await api().get(`/api/goals/${sprint.id}`).set("Cookie", cookie).expect(200)).body as Goal;
    expect(after.progress).toBeGreaterThan(sprint.progress);
  });
});
