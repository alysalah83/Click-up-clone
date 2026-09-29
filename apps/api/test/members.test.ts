import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

async function sharedWorkspace() {
  const owner = await signUp();
  const member = await signUp();
  const outsider = await signUp();
  const seeded = await seedWorkspace(owner.cookie);
  const task = await createTask(owner.cookie, { listId: seeded.list.id, statusId: seeded.openStatus.id });

  const invite = await api()
    .post(`/api/workspaces/${seeded.workspace.id}/invites`)
    .set("Cookie", owner.cookie)
    .send({ role: "member" })
    .expect(201);
  const token = invite.body.token as string;

  return { owner, member, outsider, seeded, task, token, url: invite.body.url as string };
}

describe("workspace membership", () => {
  it("an invite can be previewed without login and accepting it adds a membership", async () => {
    const { owner, member, seeded, token, url } = await sharedWorkspace();
    expect(url).toMatch(new RegExp(`/invite/${token}$`));

    const preview = await api().get(`/api/invites/${token}`).expect(200);
    expect(preview.body).toMatchObject({
      workspace: { id: seeded.workspace.id, name: "Engineering" },
      inviter: { name: "Test User" },
      role: "member",
    });

    await api().post(`/api/invites/${token}/accept`).expect(401);
    const accepted = await api().post(`/api/invites/${token}/accept`).set("Cookie", member.cookie).expect(200);
    expect(accepted.body).toEqual({ workspaceId: seeded.workspace.id, role: "member", listId: seeded.list.id });

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: seeded.workspace.id, userId: member.user.id } },
    });
    expect(membership?.role).toBe("member");

    const members = await api()
      .get(`/api/workspaces/${seeded.workspace.id}/members`)
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(members.body.map((m: { userId: string; role: string }) => [m.userId, m.role])).toEqual([
      [owner.user.id, "owner"],
      [member.user.id, "member"],
    ]);

    await api().get(`/api/invites/${"x".repeat(32)}`).expect(404);
  });

  it("a member can read and update tasks in a shared workspace; a non-member gets 404", async () => {
    const { member, outsider, seeded, task, token } = await sharedWorkspace();
    await api().post(`/api/invites/${token}/accept`).set("Cookie", member.cookie).expect(200);

    const tasks = await api().get(`/api/tasks?listId=${seeded.list.id}`).set("Cookie", member.cookie).expect(200);
    expect(tasks.body.map((t: { id: string }) => t.id)).toEqual([task.id]);
    const spaces = await api().get("/api/workspaces").set("Cookie", member.cookie).expect(200);
    expect(spaces.body.map((w: { id: string }) => w.id)).toEqual([seeded.workspace.id]);
    await api().get(`/api/statuses/list/${seeded.list.id}`).set("Cookie", member.cookie).expect(200);
    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", member.cookie)
      .send({ name: "Edited by teammate", statusId: seeded.doneStatus.id })
      .expect(200);

    await api().patch(`/api/tasks/${task.id}`).set("Cookie", outsider.cookie).send({ name: "x" }).expect(404);
    await api().get(`/api/lists/${seeded.list.id}`).set("Cookie", outsider.cookie).expect(404);
    await api().get(`/api/workspaces/${seeded.workspace.id}/members`).set("Cookie", outsider.cookie).expect(404);
    const outsiderTasks = await api().get("/api/tasks").set("Cookie", outsider.cookie).expect(200);
    expect(outsiderTasks.body).toEqual([]);

    // Members cannot manage the workspace: role changes and invites need admin.
    await api()
      .patch(`/api/workspaces/${seeded.workspace.id}/members/${member.user.id}`)
      .set("Cookie", member.cookie)
      .send({ role: "admin" })
      .expect(403);
    await api().post(`/api/workspaces/${seeded.workspace.id}/invites`).set("Cookie", member.cookie).send({}).expect(403);
  });

  it("assignees must be workspace members, and task payloads include them", async () => {
    const { owner, member, outsider, task, token } = await sharedWorkspace();
    await api().post(`/api/invites/${token}/accept`).set("Cookie", member.cookie).expect(200);

    await api()
      .put(`/api/tasks/${task.id}/assignees`)
      .set("Cookie", owner.cookie)
      .send({ userIds: [member.user.id, outsider.user.id] })
      .expect(422);

    const res = await api()
      .put(`/api/tasks/${task.id}/assignees`)
      .set("Cookie", owner.cookie)
      .send({ userIds: [member.user.id, owner.user.id] })
      .expect(200);
    expect(res.body.assignees.map((a: { id: string }) => a.id).sort()).toEqual(
      [member.user.id, owner.user.id].sort(),
    );
    expect(res.body.assignees[0]).toHaveProperty("avatarColor");

    await api().put(`/api/tasks/${task.id}/assignees`).set("Cookie", outsider.cookie).send({ userIds: [] }).expect(404);

    const people = await api().get("/api/members").set("Cookie", owner.cookie).expect(200);
    const teammate = people.body.find((p: { id: string }) => p.id === member.user.id);
    expect(teammate).toMatchObject({ assignedTasksCount: 1, workspaces: [{ role: "member" }] });

    // Removing a member drops their assignments in that workspace.
    const workspaceId = (await prisma.workspaceMember.findFirstOrThrow({ where: { userId: member.user.id } }))
      .workspaceId;
    await api().delete(`/api/workspaces/${workspaceId}/members/${member.user.id}`).set("Cookie", owner.cookie).expect(204);
    expect(await prisma.taskAssignee.count({ where: { userId: member.user.id } })).toBe(0);
  });
});
