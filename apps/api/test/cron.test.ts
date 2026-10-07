import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { api, createTask, seedWorkspace, signUp } from "./helpers.js";

const EIGHT_DAYS_AGO = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

async function guestWithData() {
  const res = await api().post("/api/users/register/guest").expect(201);
  const cookie = `token=${res.body.token}`;
  const seeded = await seedWorkspace(cookie);
  await createTask(cookie, { listId: seeded.list.id, statusId: seeded.openStatus.id });
  return { id: res.body.user.id as string, avatarId: seeded.workspace.avatarId };
}

describe("GET /internal/cron/cleanup-guests", () => {
  it("rejects calls without the cron secret", async () => {
    await api().get("/internal/cron/cleanup-guests").expect(401);
    await api().get("/internal/cron/cleanup-guests").set("Authorization", "Bearer wrong").expect(401);
  });

  it("deletes guests older than 7 days with all their data, and keeps everyone else", async () => {
    const stale = await guestWithData();
    const fresh = await guestWithData();
    const member = await signUp();
    await prisma.user.update({ where: { id: stale.id }, data: { createdAt: EIGHT_DAYS_AGO } });
    await prisma.user.update({ where: { id: member.user.id }, data: { createdAt: EIGHT_DAYS_AGO } });

    const staleTeam = await prisma.user.findMany({ where: { demoOwnerId: stale.id }, select: { id: true } });
    const staleUserIds = [stale.id, ...staleTeam.map((u) => u.id)];
    expect(staleTeam).toHaveLength(6);
    expect(await prisma.taskAssignee.count({ where: { userId: { in: staleUserIds } } })).toBeGreaterThan(0);

    const res = await api()
      .get("/internal/cron/cleanup-guests")
      .set("Authorization", "Bearer test-cron-secret")
      .expect(200);

    expect(res.body).toEqual({ deletedGuests: 1 });
    expect(await prisma.user.findUnique({ where: { id: stale.id } })).toBeNull();
    expect(await prisma.task.count({ where: { userId: stale.id } })).toBe(0);
    expect(await prisma.avatar.count({ where: { id: stale.avatarId } })).toBe(0);
    // The seeded fake teammates, their memberships and assignments go with the guest.
    expect(await prisma.user.count({ where: { id: { in: staleUserIds } } })).toBe(0);
    expect(await prisma.workspaceMember.count({ where: { userId: { in: staleUserIds } } })).toBe(0);
    expect(await prisma.taskAssignee.count({ where: { userId: { in: staleUserIds } } })).toBe(0);
    expect(await prisma.user.count({ where: { demoOwnerId: fresh.id } })).toBe(6);
    expect(await prisma.taskAssignee.count({ where: { task: { userId: fresh.id } } })).toBeGreaterThan(0);
    expect(await prisma.user.findUnique({ where: { id: fresh.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: member.user.id } })).not.toBeNull();
  });

  it("removes every row of a stale seeded guest", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const id = res.body.user.id as string;
    expect(await prisma.task.count({ where: { userId: id } })).toBeGreaterThan(0);
    expect(await prisma.doc.count()).toBeGreaterThan(0);
    expect(await prisma.whiteboard.count()).toBeGreaterThan(0);
    expect(await prisma.goalTargetTask.count()).toBeGreaterThan(0);
    expect(await prisma.activity.count()).toBeGreaterThan(0);
    expect(await prisma.tag.count()).toBeGreaterThan(0);
    expect(await prisma.attachment.count()).toBeGreaterThan(0);
    expect(await prisma.taskTemplate.count()).toBeGreaterThan(0);
    expect(await prisma.form.count()).toBeGreaterThan(0);
    expect(await prisma.customFieldValue.count()).toBeGreaterThan(0);
    expect(await prisma.chatMessage.count()).toBeGreaterThan(0);
    expect(await prisma.chatChannelRead.count()).toBeGreaterThan(0);
    await prisma.user.update({ where: { id }, data: { createdAt: EIGHT_DAYS_AGO } });

    const cleanup = await api()
      .get("/internal/cron/cleanup-guests")
      .set("Authorization", "Bearer test-cron-secret")
      .expect(200);

    expect(cleanup.body).toEqual({ deletedGuests: 1 });
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.workspace.count()).toBe(0);
    expect(await prisma.avatar.count()).toBe(0);
    expect(await prisma.list.count()).toBe(0);
    expect(await prisma.status.count()).toBe(0);
    expect(await prisma.task.count()).toBe(0);
    expect(await prisma.checklist.count()).toBe(0);
    expect(await prisma.checklistItem.count()).toBe(0);
    expect(await prisma.tag.count()).toBe(0);
    expect(await prisma.taskTag.count()).toBe(0);
    expect(await prisma.activity.count()).toBe(0);
    expect(await prisma.doc.count()).toBe(0);
    expect(await prisma.whiteboard.count()).toBe(0);
    expect(await prisma.goal.count()).toBe(0);
    expect(await prisma.goalTarget.count()).toBe(0);
    expect(await prisma.goalTargetTask.count()).toBe(0);
    expect(await prisma.attachment.count()).toBe(0);
    expect(await prisma.taskTemplate.count()).toBe(0);
    expect(await prisma.form.count()).toBe(0);
    expect(await prisma.customField.count()).toBe(0);
    expect(await prisma.customFieldValue.count()).toBe(0);
    expect(await prisma.chatChannel.count()).toBe(0);
    expect(await prisma.chatMessage.count()).toBe(0);
    expect(await prisma.chatReaction.count()).toBe(0);
    expect(await prisma.chatMention.count()).toBe(0);
    expect(await prisma.chatChannelRead.count()).toBe(0);
    expect(await prisma.notification.count()).toBe(0);
  });
});
