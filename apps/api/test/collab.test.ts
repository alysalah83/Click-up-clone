import { describe, expect, it } from "vitest";
import { bucketFor } from "../src/services/home.service.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

async function team() {
  const owner = await signUp({ name: "Olivia Owner" });
  const member = await signUp({ name: "Mo Member" });
  const outsider = await signUp();
  const seeded = await seedWorkspace(owner.cookie);
  const task = await createTask(owner.cookie, {
    listId: seeded.list.id,
    statusId: seeded.openStatus.id,
    name: "Ship the beta",
  });
  const invite = await api()
    .post(`/api/workspaces/${seeded.workspace.id}/invites`)
    .set("Cookie", owner.cookie)
    .send({ role: "member" })
    .expect(201);
  await api().post(`/api/invites/${invite.body.token}/accept`).set("Cookie", member.cookie).expect(200);
  return { owner, member, outsider, seeded, task };
}

describe("comments, notifications, my work and search", () => {
  it("threads comments with mentions and reactions, and notifies the right people", async () => {
    const { owner, member, outsider, task } = await team();
    const path = `/api/tasks/${task.id}/comments`;

    const top = await api()
      .post(path)
      .set("Cookie", owner.cookie)
      .send({ body: `Hi @[Mo Member](${member.user.id}), please look` })
      .expect(201);
    expect(top.body.mentions).toEqual([{ userId: member.user.id, name: "Mo Member" }]);

    const reply = await api()
      .post(path)
      .set("Cookie", member.cookie)
      .send({ body: "On it", parentId: top.body.id })
      .expect(201);
    expect(reply.body.parentId).toBe(top.body.id);

    const react = await api()
      .post(`/api/comments/${top.body.id}/reactions`)
      .set("Cookie", member.cookie)
      .send({ emoji: "👍" })
      .expect(200);
    expect(react.body.reactions).toEqual([{ emoji: "👍", userIds: [member.user.id] }]);

    const list = await api().get(path).set("Cookie", member.cookie).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].replies.map((r: { id: string }) => r.id)).toEqual([reply.body.id]);
    await api().get(path).set("Cookie", outsider.cookie).expect(404);
    await api().delete(`/api/comments/${top.body.id}`).set("Cookie", member.cookie).expect(403);

    // Member: mentioned. Owner: told about the reply (commented on).
    const mine = await api().get("/api/notifications").set("Cookie", member.cookie).expect(200);
    expect(mine.body.map((n: { type: string }) => n.type)).toEqual(["MENTIONED"]);
    expect(mine.body[0]).toMatchObject({ actor: { id: owner.user.id }, task: { id: task.id } });
    const theirs = await api().get("/api/notifications").set("Cookie", owner.cookie).expect(200);
    expect(theirs.body.map((n: { type: string }) => n.type)).toEqual(["COMMENTED"]);

    const count = await api().get("/api/notifications/unread-count").set("Cookie", member.cookie).expect(200);
    expect(count.body).toEqual({ count: 1 });
    await api().post(`/api/notifications/${mine.body[0].id}/read`).set("Cookie", member.cookie).expect(200);
    await api().post("/api/notifications/read-all").set("Cookie", owner.cookie).expect(200);
    const after = await api().get("/api/notifications/unread-count").set("Cookie", owner.cookie).expect(200);
    expect(after.body).toEqual({ count: 0 });
  });

  it("notifies on assignment and task changes, lists my work with buckets, and searches", async () => {
    const { owner, member, task } = await team();
    await api()
      .put(`/api/tasks/${task.id}/assignees`)
      .set("Cookie", owner.cookie)
      .send({ userIds: [member.user.id] })
      .expect(200);
    await api()
      .patch(`/api/tasks/${task.id}`)
      .set("Cookie", owner.cookie)
      .send({ priority: "urgent", endDate: new Date(Date.now() - 3 * 86_400_000).toISOString() })
      .expect(200);

    const inbox = await api().get("/api/notifications").set("Cookie", member.cookie).expect(200);
    expect(inbox.body.map((n: { type: string }) => n.type).sort()).toEqual(["ASSIGNED", "TASK_UPDATED"]);
    // Never notify the actor about their own change.
    const own = await api().get("/api/notifications/unread-count").set("Cookie", owner.cookie).expect(200);
    expect(own.body.count).toBe(0);

    const work = await api().get("/api/my-work?tz=60").set("Cookie", member.cookie).expect(200);
    expect(work.body).toHaveLength(1);
    expect(work.body[0]).toMatchObject({ id: task.id, bucket: "overdue", priority: "urgent" });
    expect(work.body[0].list.name).toBe("Sprint 1");

    const found = await api().get("/api/search?q=BETA").set("Cookie", member.cookie).expect(200);
    expect(found.body.tasks.map((t: { id: string }) => t.id)).toEqual([task.id]);
    const people = await api().get("/api/search?q=olivia").set("Cookie", member.cookie).expect(200);
    expect(people.body.members.map((m: { id: string }) => m.id)).toEqual([owner.user.id]);
  });

  it("seeds demo comments, notifications and my-work tasks for a guest", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;
    const work = await api().get("/api/my-work").set("Cookie", cookie).expect(200);
    const buckets = new Set(work.body.map((t: { bucket: string }) => t.bucket));
    expect(work.body.length).toBeGreaterThanOrEqual(8);
    expect(buckets).toEqual(new Set(["overdue", "today", "upcoming", "nodate"]));
    const unread = await api().get("/api/notifications/unread-count").set("Cookie", cookie).expect(200);
    expect(unread.body.count).toBeGreaterThanOrEqual(3);
    const sso = work.body.find((t: { name: string }) => t.name.includes("Google SSO"));
    const comments = await api().get(`/api/tasks/${sso.id}/comments`).set("Cookie", cookie).expect(200);
    expect(comments.body[0].replies.length).toBeGreaterThan(0);
    expect(comments.body[0].mentions.length).toBeGreaterThan(0);
  });

  it("buckets due dates by the client's calendar day", () => {
    const now = new Date("2026-10-01T23:30:00Z");
    expect(bucketFor(null, now)).toBe("nodate");
    expect(bucketFor(new Date("2026-10-01T12:00:00Z"), now)).toBe("today");
    expect(bucketFor(new Date("2026-09-30T12:00:00Z"), now)).toBe("overdue");
    expect(bucketFor(new Date("2026-10-02T12:00:00Z"), now)).toBe("upcoming");
    // UTC+2: it is already Oct 2 there, so Oct 2 noon is today.
    expect(bucketFor(new Date("2026-10-02T12:00:00Z"), now, 120)).toBe("today");
  });
});
