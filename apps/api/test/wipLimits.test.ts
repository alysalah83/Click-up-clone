import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

describe("status WIP limits", () => {
  it("sets and clears a column's WIP limit", async () => {
    const a = await signUp();
    const { openStatus } = await seedWorkspace(a.cookie);
    expect(openStatus.wipLimit ?? null).toBeNull();

    const set = await api().patch(`/api/statuses/${openStatus.id}`).set("Cookie", a.cookie).send({ wipLimit: 4 }).expect(200);
    expect(set.body).toMatchObject({ id: openStatus.id, wipLimit: 4 });

    const cleared = await api()
      .patch(`/api/statuses/${openStatus.id}`)
      .set("Cookie", a.cookie)
      .send({ wipLimit: null })
      .expect(200);
    expect(cleared.body.wipLimit).toBeNull();
  });

  it("rejects invalid limits and other users' statuses", async () => {
    const a = await signUp();
    const b = await signUp();
    const { openStatus } = await seedWorkspace(a.cookie);
    for (const wipLimit of [0, -1, 2.5, 1000, "3"]) {
      await api().patch(`/api/statuses/${openStatus.id}`).set("Cookie", a.cookie).send({ wipLimit }).expect(422);
    }
    await api().patch(`/api/statuses/${openStatus.id}`).set("Cookie", b.cookie).send({ wipLimit: 2 }).expect(404);
  });

  it("seeds WIP limits on the Sprint 14 board, with in progress over its limit", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const statuses = await api()
      .get(`/api/statuses/list/${res.body.landingListId}`)
      .set("Cookie", `token=${res.body.token}`)
      .expect(200);
    const byName = new Map<string, { id: string; wipLimit: number | null }>(
      statuses.body.map((s: { name: string; id: string; wipLimit: number | null }) => [s.name, s]),
    );
    const inProgress = byName.get("in progress")!;
    const review = byName.get("in review")!;
    expect(inProgress.wipLimit).toBe(3);
    expect(review.wipLimit).toBe(3);
    expect(byName.get("to do")!.wipLimit).toBeNull();
    const count = (statusId: string) => prisma.task.count({ where: { statusId, parentTaskId: null } });
    expect(await count(inProgress.id)).toBeGreaterThan(3);
    expect(await count(review.id)).toBeLessThanOrEqual(3);

    const views = await prisma.savedView.findMany({ where: { listId: res.body.landingListId } });
    const byAssignee = views.find((v) => v.name === "By assignee");
    expect(byAssignee?.config).toMatchObject({ groupBy: "status", swimlanes: "assignee" });
    expect(byAssignee?.isDefault).toBe(false);
  });
});
