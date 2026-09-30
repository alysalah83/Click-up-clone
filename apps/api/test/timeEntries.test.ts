import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { summary, trackedSeconds } from "../src/services/dashboard.service.js";
import { durationSeconds } from "../src/services/timeEntry.service.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

describe("time tracking helpers", () => {
  it("computes whole seconds, never negative", () => {
    expect(durationSeconds(new Date(1000), new Date(91_400))).toBe(90);
    expect(durationSeconds(new Date(5000), new Date(1000))).toBe(0);
  });

  it("counts a running timer up to now", () => {
    const now = new Date("2026-10-01T10:00:00Z");
    expect(
      trackedSeconds({ startedAt: new Date("2026-10-01T09:30:00Z"), endedAt: null, durationSec: null }, now),
    ).toBe(1800);
    expect(trackedSeconds({ startedAt: now, endedAt: now, durationSec: 42 }, now)).toBe(42);
  });
});

describe("time entries", () => {
  async function setup() {
    const user = await signUp();
    const ws = await seedWorkspace(user.cookie);
    const a = await createTask(user.cookie, { listId: ws.list.id, statusId: ws.openStatus.id, name: "A" });
    const b = await createTask(user.cookie, { listId: ws.list.id, statusId: ws.openStatus.id, name: "B" });
    return { user, ws, a, b };
  }

  it("starts, stops (computing the duration) and lists entries with the total", async () => {
    const { user, a } = await setup();
    const started = await api().post("/api/time-entries/start").set("Cookie", user.cookie).send({ taskId: a.id }).expect(201);
    expect(started.body.endedAt).toBeNull();

    await prisma.timeEntry.update({
      where: { id: started.body.id },
      data: { startedAt: new Date(Date.now() - 120_000) },
    });
    const stopped = await api().post(`/api/time-entries/${started.body.id}/stop`).set("Cookie", user.cookie).expect(200);
    expect(stopped.body.durationSec).toBeGreaterThanOrEqual(120);
    expect(stopped.body.durationSec).toBeLessThan(130);

    await api().post("/api/time-entries/manual").set("Cookie", user.cookie).send({ taskId: a.id, durationSec: 1800 }).expect(201);
    const list = await api().get(`/api/time-entries?taskId=${a.id}`).set("Cookie", user.cookie).expect(200);
    expect(list.body.entries).toHaveLength(2);
    expect(list.body.totalSec).toBe(stopped.body.durationSec + 1800);
    expect(list.body.running).toBeNull();
    expect(await prisma.activity.count({ where: { taskId: a.id, type: "time_logged" } })).toBe(2);
  });

  it("allows one running timer per user: starting another stops the first", async () => {
    const { user, a, b } = await setup();
    const first = await api().post("/api/time-entries/start").set("Cookie", user.cookie).send({ taskId: a.id }).expect(201);
    const second = await api().post("/api/time-entries/start").set("Cookie", user.cookie).send({ taskId: b.id }).expect(201);

    expect(await prisma.timeEntry.count({ where: { userId: user.user.id, endedAt: null } })).toBe(1);
    const stoppedFirst = await prisma.timeEntry.findUniqueOrThrow({ where: { id: first.body.id } });
    expect(stoppedFirst.endedAt).not.toBeNull();
    expect(stoppedFirst.durationSec).not.toBeNull();

    const list = await api().get(`/api/time-entries?taskId=${a.id}`).set("Cookie", user.cookie).expect(200);
    expect(list.body.running).toMatchObject({ id: second.body.id, taskName: "B" });
  });

  it("deletes own entries, and hides tasks from non-members", async () => {
    const { user, a } = await setup();
    const outsider = await signUp();
    const entry = await api()
      .post("/api/time-entries/manual")
      .set("Cookie", user.cookie)
      .send({ taskId: a.id, durationSec: 600 })
      .expect(201);

    await api().get(`/api/time-entries?taskId=${a.id}`).set("Cookie", outsider.cookie).expect(404);
    await api().post("/api/time-entries/start").set("Cookie", outsider.cookie).send({ taskId: a.id }).expect(404);
    await api().delete(`/api/time-entries/${entry.body.id}`).set("Cookie", outsider.cookie).expect(404);
    await api().delete(`/api/time-entries/${entry.body.id}`).set("Cookie", user.cookie).expect(204);
    expect(await prisma.timeEntry.count({ where: { taskId: a.id } })).toBe(0);
  });

  it("rejects bad manual durations", async () => {
    const { user, a } = await setup();
    await api().post("/api/time-entries/manual").set("Cookie", user.cookie).send({ taskId: a.id, durationSec: 0 }).expect(422);
  });

  it("adds tracked time to the dashboard summary, total and per member", async () => {
    const { user, a } = await setup();
    await api().post("/api/time-entries/manual").set("Cookie", user.cookie).send({ taskId: a.id, durationSec: 3600 }).expect(201);
    const result = await summary(user.user.id);
    expect(result.timeTrackedThisWeekSec).toBe(3600);
    expect(result.timeByMember).toEqual([{ name: "Test User", seconds: 3600 }]);
  });
});
