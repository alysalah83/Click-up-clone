import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { buildBurndown, mapStatus, nextSprintWindow } from "../src/lib/utils/sprint.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

const DAY = 24 * 60 * 60 * 1000;

describe("sprint math", () => {
  it("places the next sprint the day after the previous one, two weeks long", () => {
    const today = new Date("2026-10-06T08:30:00Z");
    expect(nextSprintWindow(null, today)).toEqual({
      start: new Date("2026-10-06T12:00:00Z"),
      end: new Date("2026-10-19T12:00:00Z"),
    });
    expect(nextSprintWindow(new Date("2026-10-19T12:00:00Z"), today).start).toEqual(new Date("2026-10-20T12:00:00Z"));
  });

  it("maps a status by name, then by type, then to the first open status", () => {
    const targets = [
      { id: "todo", name: "To Do", type: "open" as const, order: 100, isDefault: true },
      { id: "doing", name: "doing", type: "active" as const, order: 200, isDefault: true },
      { id: "review", name: "in review", type: "active" as const, order: 300 },
      { id: "done", name: "done", type: "done" as const, order: 1000, isDefault: true },
    ];
    expect(mapStatus({ name: "In Review", type: "active" }, targets)).toBe("review");
    expect(mapStatus({ name: "in progress", type: "active" }, targets)).toBe("doing");
    expect(mapStatus({ name: "blocked", type: "open" }, targets)).toBe("todo");
  });

  it("builds ideal and remaining lines over the sprint days, future days empty", () => {
    const start = new Date("2026-10-01T12:00:00Z");
    const end = new Date("2026-10-05T12:00:00Z");
    const now = new Date("2026-10-03T15:00:00Z");
    const { unit, total, points } = buildBurndown({
      start,
      end,
      now,
      tasks: [
        { points: 5, completedAt: new Date("2026-10-01T10:00:00Z") },
        { points: 3, completedAt: new Date("2026-10-03T14:00:00Z") },
        { points: 2, completedAt: null },
      ],
    });
    expect(unit).toBe("points");
    expect(total).toBe(10);
    expect(points.map((p) => p.ideal)).toEqual([10, 7.5, 5, 2.5, 0]);
    expect(points.map((p) => p.remaining)).toEqual([5, 5, 2, null, null]);
  });

  it("counts tasks when nothing has points", () => {
    const day = new Date("2026-10-01T12:00:00Z");
    const result = buildBurndown({ start: day, end: day, now: day, tasks: [{ points: null, completedAt: null }] });
    expect(result).toMatchObject({ unit: "tasks", total: 1 });
  });
});

async function setup() {
  const owner = await signUp();
  const { workspace, list } = await seedWorkspace(owner.cookie);
  return { owner, workspaceId: workspace.id, plainListId: list.id };
}

const createSprint = (cookie: string, workspaceId: string) =>
  api().post("/api/sprints").set("Cookie", cookie).send({ workspaceId });

describe("sprints API", () => {
  it("creates numbered two-week sprints: the first active, later ones planned", async () => {
    const { owner, workspaceId } = await setup();
    const first = (await createSprint(owner.cookie, workspaceId).expect(201)).body;
    expect(first).toMatchObject({ name: "Sprint 1", sprintNumber: 1, sprintState: "active" });
    expect(first.status.map((s: { type: string }) => s.type)).toEqual(["open", "active", "done"]);
    const second = (await createSprint(owner.cookie, workspaceId).expect(201)).body;
    expect(second).toMatchObject({ name: "Sprint 2", sprintNumber: 2, sprintState: "planned" });
    expect(new Date(second.sprintStart).getTime() - new Date(first.sprintEnd).getTime()).toBe(DAY);
    expect(new Date(second.sprintEnd).getTime() - new Date(second.sprintStart).getTime()).toBe(13 * DAY);
  });

  it("stores points, stamps completedAt on done and sums the sprint header", async () => {
    const { owner, workspaceId } = await setup();
    const sprint = (await createSprint(owner.cookie, workspaceId).expect(201)).body;
    const [open, , done] = sprint.status as { id: string }[];
    const a = await createTask(owner.cookie, { listId: sprint.id, statusId: open!.id, name: "A" });
    const b = await createTask(owner.cookie, { listId: sprint.id, statusId: open!.id, name: "B" });

    const patched = await api().patch(`/api/tasks/${a.id}`).set("Cookie", owner.cookie).send({ points: 5 }).expect(200);
    expect(patched.body.points).toBe(5);
    await api().patch(`/api/tasks/${b.id}`).set("Cookie", owner.cookie).send({ points: 3, statusId: done!.id }).expect(200);
    await api().patch(`/api/tasks/${a.id}`).set("Cookie", owner.cookie).send({ points: 1.5 }).expect(422);
    expect((await prisma.task.findUniqueOrThrow({ where: { id: b.id } })).completedAt).toBeInstanceOf(Date);
    expect(await prisma.activity.count({ where: { taskId: a.id, type: "points" } })).toBe(1);

    const summary = await api().get(`/api/sprints/${sprint.id}`).set("Cookie", owner.cookie).expect(200);
    expect(summary.body).toMatchObject({ totalPoints: 8, donePoints: 3, doneCount: 1, unfinishedCount: 1, nextSprint: null });

    // Leaving done clears the completion time.
    await api().patch(`/api/tasks/${b.id}`).set("Cookie", owner.cookie).send({ statusId: open!.id }).expect(200);
    expect((await prisma.task.findUniqueOrThrow({ where: { id: b.id } })).completedAt).toBeNull();
  });

  it("completes the active sprint: carries unfinished tasks with mapped statuses into a new sprint", async () => {
    const { owner, workspaceId } = await setup();
    const sprint = (await createSprint(owner.cookie, workspaceId).expect(201)).body;
    const [open, active, done] = sprint.status as { id: string }[];
    const doing = await createTask(owner.cookie, { listId: sprint.id, statusId: active!.id, name: "Doing" });
    const todo = await createTask(owner.cookie, { listId: sprint.id, statusId: open!.id, name: "Todo" });
    const finished = await createTask(owner.cookie, { listId: sprint.id, statusId: done!.id, name: "Finished" });
    await prisma.task.update({ where: { id: doing.id }, data: { points: 5 } });
    await prisma.task.update({ where: { id: todo.id }, data: { points: 2 } });
    await prisma.task.update({ where: { id: finished.id }, data: { points: 3 } });
    const subtask = await api()
      .post(`/api/tasks/${doing.id}/subtasks`)
      .set("Cookie", owner.cookie)
      .send({ name: "Sub" })
      .expect(201);

    const res = await api().post(`/api/sprints/${sprint.id}/complete`).set("Cookie", owner.cookie).expect(200);
    expect(res.body).toMatchObject({ carriedCount: 2, carriedPoints: 7, doneCount: 1, nextSprint: { name: "Sprint 2" } });
    const nextId = res.body.nextSprint.id as string;

    const next = await prisma.list.findUniqueOrThrow({ where: { id: nextId }, include: { status: true } });
    expect(next.sprintState).toBe("active");
    const moved = await prisma.task.findMany({
      where: { id: { in: [doing.id, todo.id, subtask.body.id] } },
      include: { status: true },
    });
    expect(moved.every((t) => t.listId === nextId && t.status.listId === nextId)).toBe(true);
    expect(moved.find((t) => t.id === doing.id)!.status.name).toBe("in progress");
    expect((await prisma.task.findUniqueOrThrow({ where: { id: finished.id } })).listId).toBe(sprint.id);

    const old = await prisma.list.findUniqueOrThrow({ where: { id: sprint.id } });
    expect(old).toMatchObject({ sprintState: "completed", sprintCommittedPoints: 10, sprintCompletedPoints: 3 });
    expect(await prisma.activity.count({ where: { type: "sprint_carried", data: { path: ["fromListId"], equals: sprint.id } } })).toBe(2);

    await api().post(`/api/sprints/${sprint.id}/complete`).set("Cookie", owner.cookie).expect(409);

    // The finished sprint's report still counts the carried work; velocity lists it.
    const report = await api().get(`/api/sprints/${sprint.id}/report`).set("Cookie", owner.cookie).expect(200);
    expect(report.body.burndown).toMatchObject({ unit: "points", total: 10, carriedOutCount: 2 });
    expect(report.body.burndown.points).toHaveLength(14);
    expect(report.body.burndown.points[0]).toMatchObject({ ideal: 10, remaining: 7 });
    expect(report.body.velocity.sprints).toEqual([{ id: sprint.id, name: "Sprint 1", committed: 10, completed: 3 }]);
  });

  it("rejects plain lists and outsiders", async () => {
    const { owner, workspaceId, plainListId } = await setup();
    const outsider = await signUp();
    const sprint = (await createSprint(owner.cookie, workspaceId).expect(201)).body;
    await api().get(`/api/sprints/${plainListId}`).set("Cookie", owner.cookie).expect(400);
    await api().get(`/api/sprints/${sprint.id}`).set("Cookie", outsider.cookie).expect(404);
    await api().post(`/api/sprints/${sprint.id}/complete`).set("Cookie", outsider.cookie).expect(404);
    await createSprint(outsider.cookie, workspaceId).expect(404);
  });
});

describe("guest demo sprints", () => {
  it("seeds a sprint series with an active sprint half done and a velocity history", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;
    const landingListId = res.body.landingListId as string;

    const summary = (await api().get(`/api/sprints/${landingListId}`).set("Cookie", cookie).expect(200)).body;
    expect(summary).toMatchObject({ name: "Sprint 14", sprintState: "active", nextSprint: { name: "Sprint 15" } });
    expect(summary.donePoints / summary.totalPoints).toBeGreaterThan(0.35);
    expect(summary.donePoints / summary.totalPoints).toBeLessThan(0.65);
    const tasks = await prisma.task.findMany({ where: { listId: landingListId, parentTaskId: null } });
    expect(tasks.every((t) => t.points)).toBe(true);

    const report = (await api().get(`/api/sprints/${landingListId}/report`).set("Cookie", cookie).expect(200)).body;
    const days = report.burndown.points as { remaining: number | null }[];
    expect(days).toHaveLength(14);
    const past = days.filter((d) => d.remaining !== null).map((d) => d.remaining!);
    expect(past.length).toBeGreaterThanOrEqual(6);
    expect(past.at(-1)!).toBeLessThan(past[0]!);
    expect(report.velocity.sprints.map((s: { name: string }) => s.name)).toEqual(["Sprint 11", "Sprint 12", "Sprint 13"]);
    for (const s of report.velocity.sprints as { committed: number; completed: number }[])
      expect(s.completed).toBeLessThanOrEqual(s.committed);

    // The finished sprint keeps the tasks it carried over in its burndown.
    const sprint13 = await prisma.list.findFirstOrThrow({ where: { userId: res.body.user.id, sprintNumber: 13 } });
    const finished = (await api().get(`/api/sprints/${sprint13.id}/report`).set("Cookie", cookie).expect(200)).body;
    expect(finished.burndown.carriedOutCount).toBe(3);
    expect(finished.burndown.points.at(-1).remaining).toBeGreaterThan(0);
    expect(finished.burndown.total).toBe(sprint13.sprintCommittedPoints);
  });
});
