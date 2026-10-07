import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, seedWorkspace, signUp } from "./helpers.js";

async function team() {
  const owner = await signUp({ name: "Olivia Owner" });
  const member = await signUp({ name: "Mo Member" });
  const outsider = await signUp();
  const seeded = await seedWorkspace(owner.cookie, "Product");
  const invite = await api()
    .post(`/api/workspaces/${seeded.workspace.id}/invites`)
    .set("Cookie", owner.cookie)
    .send({ role: "member" })
    .expect(201);
  await api().post(`/api/invites/${invite.body.token}/accept`).set("Cookie", member.cookie).expect(200);
  const channel = await api()
    .post("/api/chat/channels")
    .set("Cookie", owner.cookie)
    .send({ workspaceId: seeded.workspace.id, name: "#Product Team", topic: "All things product" })
    .expect(201);
  return { owner, member, outsider, seeded, channelId: channel.body.id as string, channel: channel.body };
}

const post = (cookie: string, channelId: string, body: string, parentId?: string) =>
  api().post(`/api/chat/channels/${channelId}/messages`).set("Cookie", cookie).send({ body, parentId });

describe("chat channels", () => {
  it("creates, renames, lists and deletes channels of a space; outsiders see nothing", async () => {
    const { owner, member, outsider, seeded, channelId, channel } = await team();
    expect(channel).toMatchObject({ name: "product-team", topic: "All things product" });

    await api()
      .post("/api/chat/channels")
      .set("Cookie", member.cookie)
      .send({ workspaceId: seeded.workspace.id, name: "product team" })
      .expect(409);

    const renamed = await api()
      .patch(`/api/chat/channels/${channelId}`)
      .set("Cookie", member.cookie)
      .send({ name: "Product" })
      .expect(200);
    expect(renamed.body.name).toBe("product");

    const list = await api()
      .get(`/api/chat/channels?workspaceId=${seeded.workspace.id}`)
      .set("Cookie", member.cookie)
      .expect(200);
    expect(list.body).toEqual([expect.objectContaining({ id: channelId, name: "product", unreadCount: 0 })]);

    const detail = await api().get(`/api/chat/channels/${channelId}`).set("Cookie", member.cookie).expect(200);
    expect(detail.body).toMatchObject({ workspaceName: "Product", viewerId: member.user.id, lastReadAt: null });
    expect(detail.body.members.map((m: { name: string }) => m.name).sort()).toEqual(["Mo Member", "Olivia Owner"]);

    await api().get(`/api/chat/channels/${channelId}`).set("Cookie", outsider.cookie).expect(404);
    expect((await api().get("/api/chat/channels").set("Cookie", outsider.cookie).expect(200)).body).toEqual([]);
    await post(outsider.cookie, channelId, "hi").expect(404);

    await api().delete(`/api/chat/channels/${channelId}`).set("Cookie", owner.cookie).expect(200);
    await api().get(`/api/chat/channels/${channelId}`).set("Cookie", owner.cookie).expect(404);
  });

  it("guests of a space can read and post but not manage channels", async () => {
    const { owner, seeded, channelId } = await team();
    const guest = await signUp({ name: "Gus Guest" });
    const invite = await api()
      .post(`/api/workspaces/${seeded.workspace.id}/invites`)
      .set("Cookie", owner.cookie)
      .send({ role: "guest" })
      .expect(201);
    await api().post(`/api/invites/${invite.body.token}/accept`).set("Cookie", guest.cookie).expect(200);
    await post(guest.cookie, channelId, "hello").expect(201);
    await api().patch(`/api/chat/channels/${channelId}`).set("Cookie", guest.cookie).send({ topic: "x" }).expect(403);
  });
});

describe("chat messages", () => {
  it("pages history with before, polls with after and since, and counts unread messages", async () => {
    const { owner, member, channelId } = await team();
    const ids: string[] = [];
    for (let i = 1; i <= 5; i++) ids.push((await post(owner.cookie, channelId, `message ${i}`).expect(201)).body.id);

    const unread = await api().get("/api/chat/channels").set("Cookie", member.cookie).expect(200);
    expect(unread.body[0].unreadCount).toBe(5);
    expect((await api().get("/api/chat/channels").set("Cookie", owner.cookie)).body[0].unreadCount).toBe(0);

    const path = `/api/chat/channels/${channelId}/messages`;
    const latest = await api().get(`${path}?limit=2`).set("Cookie", member.cookie).expect(200);
    expect(latest.body.messages.map((m: { body: string }) => m.body)).toEqual(["message 4", "message 5"]);
    expect(latest.body.hasMore).toBe(true);

    const older = await api().get(`${path}?limit=10&before=${ids[3]}`).set("Cookie", member.cookie).expect(200);
    expect(older.body.messages.map((m: { body: string }) => m.body)).toEqual(["message 1", "message 2", "message 3"]);
    expect(older.body.hasMore).toBe(false);

    const since = latest.body.serverTime as string;
    await post(owner.cookie, channelId, "message 6").expect(201);
    await api().post(`/api/chat/messages/${ids[0]}/reactions`).set("Cookie", owner.cookie).send({ emoji: "👍" }).expect(200);
    await api().delete(`/api/chat/messages/${ids[1]}`).set("Cookie", owner.cookie).expect(200);

    const poll = await api()
      .get(`${path}?after=${ids[4]}&since=${encodeURIComponent(since)}`)
      .set("Cookie", member.cookie)
      .expect(200);
    expect(poll.body.messages.map((m: { body: string }) => m.body)).toEqual(["message 6"]);
    expect(poll.body.updated.map((m: { id: string }) => m.id)).toContain(ids[0]);
    expect(poll.body.updated.find((m: { id: string }) => m.id === ids[0]).reactions).toEqual([
      { emoji: "👍", userIds: [owner.user.id] },
    ]);
    expect(poll.body.deletedIds).toEqual([ids[1]]);

    const byTime = await api()
      .get(`${path}?after=${encodeURIComponent(since)}`)
      .set("Cookie", member.cookie)
      .expect(200);
    expect(byTime.body.messages.map((m: { body: string }) => m.body)).toEqual(["message 6"]);

    await api().post(`/api/chat/channels/${channelId}/read`).set("Cookie", member.cookie).expect(200);
    expect((await api().get("/api/chat/channels").set("Cookie", member.cookie)).body[0].unreadCount).toBe(0);
  });

  it("mentions space members by token or plain @Name and notifies them in the Inbox", async () => {
    const { owner, member, outsider, channelId } = await team();
    const res = await post(
      owner.cookie,
      channelId,
      `Hey @Mo, and @[Ghost](${outsider.user.id}) is not here`,
    ).expect(201);
    expect(res.body.body).toContain(`@[Mo Member](${member.user.id})`);
    expect(res.body.mentions).toEqual([{ userId: member.user.id, name: "Mo Member" }]);

    const inbox = await api().get("/api/notifications").set("Cookie", member.cookie).expect(200);
    expect(inbox.body[0]).toMatchObject({
      type: "MENTIONED",
      message: "Olivia Owner mentioned you in #product-team",
      task: null,
      chatMessage: { id: res.body.id, channelId, channel: { name: "product-team" } },
    });
    expect((await api().get("/api/notifications").set("Cookie", outsider.cookie)).body).toEqual([]);

    // Editing adds the new mention only once.
    await api()
      .patch(`/api/chat/messages/${res.body.id}`)
      .set("Cookie", owner.cookie)
      .send({ body: `Hey @[Mo Member](${member.user.id}) again` })
      .expect(200);
    expect(await prisma.notification.count({ where: { userId: member.user.id } })).toBe(1);
  });

  it("only lets authors edit and delete, and threads replies under the top-level message", async () => {
    const { owner, member, channelId } = await team();
    const top = (await post(owner.cookie, channelId, "Ship it?").expect(201)).body;
    await api().patch(`/api/chat/messages/${top.id}`).set("Cookie", member.cookie).send({ body: "x" }).expect(403);
    await api().delete(`/api/chat/messages/${top.id}`).set("Cookie", member.cookie).expect(403);

    const edited = await api()
      .patch(`/api/chat/messages/${top.id}`)
      .set("Cookie", owner.cookie)
      .send({ body: "Ship it today?" })
      .expect(200);
    expect(edited.body.editedAt).not.toBeNull();

    const reply = (await post(member.cookie, channelId, "Yes", top.id).expect(201)).body;
    await post(owner.cookie, channelId, "Great", reply.id).expect(201);
    const replies = await api().get(`/api/chat/messages/${top.id}/replies`).set("Cookie", member.cookie).expect(200);
    expect(replies.body.map((r: { body: string; parentId: string }) => [r.body, r.parentId])).toEqual([
      ["Yes", top.id],
      ["Great", top.id],
    ]);
    const page = await api().get(`/api/chat/channels/${channelId}/messages`).set("Cookie", member.cookie).expect(200);
    expect(page.body.messages).toEqual([expect.objectContaining({ id: top.id, replyCount: 2 })]);
  });

  it("turns a message into a task in a list of the same space and links it", async () => {
    const { owner, member, seeded, channelId } = await team();
    const other = await seedWorkspace(owner.cookie, "Other");
    const msg = (
      await post(member.cookie, channelId, "**CSV export** breaks on emoji\nRepro: export a list with ☕").expect(201)
    ).body;

    await api()
      .post(`/api/chat/messages/${msg.id}/task`)
      .set("Cookie", owner.cookie)
      .send({ listId: other.list.id })
      .expect(422);

    const res = await api()
      .post(`/api/chat/messages/${msg.id}/task`)
      .set("Cookie", owner.cookie)
      .send({ listId: seeded.list.id })
      .expect(201);
    expect(res.body.task).toMatchObject({ name: "CSV export breaks on emoji", listId: seeded.list.id });
    expect(res.body.message.task).toEqual({ id: res.body.task.id, name: "CSV export breaks on emoji", listId: seeded.list.id });

    const task = await prisma.task.findUniqueOrThrow({ where: { id: res.body.task.id } });
    expect(JSON.stringify(task.description)).toContain("From #product-team by Mo Member");

    await api()
      .post(`/api/chat/messages/${msg.id}/task`)
      .set("Cookie", owner.cookie)
      .send({ listId: seeded.list.id })
      .expect(409);
  });
});

describe("chat in the guest demo", () => {
  it("seeds #product with an unread backlog, a mention in the Inbox and a message turned into a task", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const cookie = `token=${res.body.token}`;

    const channels = await api().get("/api/chat/channels").set("Cookie", cookie).expect(200);
    const names = channels.body.map((c: { name: string }) => c.name);
    expect(names).toEqual(expect.arrayContaining(["product", "marketing"]));
    const product = channels.body.find((c: { name: string }) => c.name === "product");
    expect(product.unreadCount).toBeGreaterThan(3);

    const page = await api().get(`/api/chat/channels/${product.id}/messages`).set("Cookie", cookie).expect(200);
    expect(page.body.messages.length).toBeGreaterThanOrEqual(15);
    expect(page.body.messages.some((m: { task: unknown }) => m.task)).toBe(true);
    expect(page.body.messages.some((m: { reactions: unknown[] }) => m.reactions.length > 0)).toBe(true);
    expect(page.body.messages.some((m: { replyCount: number }) => m.replyCount > 0)).toBe(true);

    const inbox = await api().get("/api/notifications").set("Cookie", cookie).expect(200);
    const chatMentions = inbox.body.filter((n: { chatMessage: unknown }) => n.chatMessage);
    expect(chatMentions.length).toBeGreaterThan(0);
    expect(chatMentions.some((n: { readAt: string | null }) => !n.readAt)).toBe(true);

    const search = await api().get("/api/search?q=prod").set("Cookie", cookie).expect(200);
    expect(search.body.channels.map((c: { name: string }) => c.name)).toContain("product");
  });
});
