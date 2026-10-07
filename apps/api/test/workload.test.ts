import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

async function invited(workspaceId: string, ownerCookie: string, role: "member" | "guest") {
  const user = await signUp();
  const invite = await api().post(`/api/workspaces/${workspaceId}/invites`).set("Cookie", ownerCookie).send({ role });
  await api().post(`/api/invites/${invite.body.token}/accept`).set("Cookie", user.cookie).expect(200);
  return user;
}

describe("workload capacity", () => {
  it("sets, lists and resets a member's capacity", async () => {
    const owner = await signUp();
    const { workspace } = await seedWorkspace(owner.cookie);
    const member = await invited(workspace.id, owner.cookie, "member");
    const url = `/api/workspaces/${workspace.id}/members/${owner.user.id}/capacity`;

    const set = await api().patch(url).set("Cookie", member.cookie).send({ capacityTasks: 4 }).expect(200);
    expect(set.body).toEqual({ userId: owner.user.id, capacityTasks: 4, capacityPoints: null });

    const members = await api().get(`/api/workspaces/${workspace.id}/members`).set("Cookie", owner.cookie).expect(200);
    expect(members.body.find((m: { userId: string }) => m.userId === owner.user.id)).toMatchObject({
      capacityTasks: 4,
      capacityPoints: null,
    });

    const reset = await api()
      .patch(url)
      .set("Cookie", owner.cookie)
      .send({ capacityTasks: null, capacityPoints: 10 })
      .expect(200);
    expect(reset.body).toMatchObject({ capacityTasks: null, capacityPoints: 10 });
  });

  it("validates input and access", async () => {
    const owner = await signUp();
    const outsider = await signUp();
    const { workspace } = await seedWorkspace(owner.cookie);
    const guest = await invited(workspace.id, owner.cookie, "guest");
    const url = `/api/workspaces/${workspace.id}/members/${owner.user.id}/capacity`;

    for (const body of [{}, { capacityTasks: 0 }, { capacityTasks: 2.5 }, { capacityPoints: 101 }, { capacityTasks: "3" }]) {
      await api().patch(url).set("Cookie", owner.cookie).send(body).expect(422);
    }
    await api().patch(url).set("Cookie", outsider.cookie).send({ capacityTasks: 2 }).expect(404);
    await api().patch(url).set("Cookie", guest.cookie).send({ capacityTasks: 2 }).expect(403);
    await api()
      .patch(`/api/workspaces/${workspace.id}/members/${outsider.user.id}/capacity`)
      .set("Cookie", owner.cookie)
      .send({ capacityTasks: 2 })
      .expect(404);
  });

  it("seeds an overloaded teammate, unassigned tasks and a capacity override on Sprint 14", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const listId = res.body.landingListId as string;
    const tasks = await prisma.task.findMany({
      where: { listId, parentTaskId: null, status: { type: { not: "done" } } },
      select: { endDate: true, assignees: { select: { user: { select: { name: true } } } } },
    });
    const today = new Date();
    const onDay = (offset: number, name: string) =>
      tasks.filter(
        (t) =>
          t.endDate &&
          Math.round((Date.UTC(t.endDate.getUTCFullYear(), t.endDate.getUTCMonth(), t.endDate.getUTCDate()) -
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / 86_400_000) === offset &&
          t.assignees.some((a) => a.user.name === name),
      ).length;
    // Default capacity is 3 tasks a day: Maya is over it today and tomorrow.
    expect(onDay(0, "Maya Chen")).toBeGreaterThan(3);
    expect(onDay(1, "Maya Chen")).toBeGreaterThan(3);
    expect(onDay(0, "Liam Patel")).toBeLessThanOrEqual(3);
    expect(tasks.some((t) => t.endDate && t.assignees.length === 0)).toBe(true);

    const list = await prisma.list.findUniqueOrThrow({ where: { id: listId } });
    const ava = await prisma.workspaceMember.findFirstOrThrow({
      where: { workspaceId: list.workspaceId, user: { name: "Ava Johnson" } },
    });
    expect(ava.capacityTasks).toBe(2);
  });
});
