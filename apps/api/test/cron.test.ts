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

    const res = await api()
      .get("/internal/cron/cleanup-guests")
      .set("Authorization", "Bearer test-cron-secret")
      .expect(200);

    expect(res.body).toEqual({ deletedGuests: 1 });
    expect(await prisma.user.findUnique({ where: { id: stale.id } })).toBeNull();
    expect(await prisma.task.count({ where: { userId: stale.id } })).toBe(0);
    expect(await prisma.avatar.count({ where: { id: stale.avatarId } })).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: fresh.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: member.user.id } })).not.toBeNull();
  });

  it("removes every row of a stale seeded guest", async () => {
    const res = await api().post("/api/users/register/guest").expect(201);
    const id = res.body.user.id as string;
    expect(await prisma.task.count({ where: { userId: id } })).toBeGreaterThan(0);
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
  });
});
