import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { seedGuest } from "../src/services/user.service.js";
import { claimPooledGuest, countPooledGuests, refillGuestPool } from "../src/services/guestPool.service.js";

const DAY = 24 * 60 * 60 * 1000;

describe("guest pool", () => {
  it("claims a pre-seeded guest once and moves its dates to the claim day", async () => {
    const { user, landingListId } = await seedGuest({ pooled: true });
    expect(await countPooledGuests()).toBe(1);
    const before = await prisma.task.findFirstOrThrow({
      where: { userId: user.id, endDate: { not: null } },
      select: { id: true, endDate: true, createdAt: true },
    });
    const sprintBefore = await prisma.list.findUniqueOrThrow({ where: { id: landingListId } });
    const doneBefore = await prisma.task.findFirstOrThrow({
      where: { userId: user.id, completedAt: { not: null } },
      select: { id: true, completedAt: true },
    });
    const goalBefore = await prisma.goal.findFirstOrThrow({ where: { createdById: user.id } });
    const attachmentBefore = await prisma.attachment.findFirstOrThrow({ where: { task: { userId: user.id } } });
    const templateBefore = await prisma.taskTemplate.findFirstOrThrow({ where: { createdById: user.id } });
    const formBefore = await prisma.form.findFirstOrThrow({ where: { createdById: user.id } });
    const dateValueBefore = await prisma.customFieldValue.findFirstOrThrow({
      where: { field: { listId: landingListId, type: "date" } },
    });
    const textValueBefore = await prisma.customFieldValue.findFirstOrThrow({
      where: { field: { listId: landingListId, type: "text" } },
    });
    const chatBefore = await prisma.chatMessage.findFirstOrThrow({ where: { channel: { workspace: { userId: user.id } } } });
    const readBefore = await prisma.chatChannelRead.findFirstOrThrow({ where: { userId: user.id } });
    const shareBefore = await prisma.shareLink.findFirstOrThrow({ where: { createdById: user.id } });

    const claimed = await claimPooledGuest(new Date(Date.now() + 3 * DAY));
    expect(claimed).toEqual({ id: user.id, landingListId });
    expect(await countPooledGuests()).toBe(0);
    expect(await claimPooledGuest()).toBeUndefined();

    const after = await prisma.task.findUniqueOrThrow({ where: { id: before.id } });
    expect(after.endDate!.getTime() - before.endDate!.getTime()).toBe(3 * DAY);
    const shift = after.createdAt.getTime() - before.createdAt.getTime();
    expect(shift).toBeGreaterThan(3 * DAY - 60_000);
    expect(shift).toBeLessThan(3 * DAY + 60_000);

    // Sprint dates move by whole days, completion times exactly.
    const sprintAfter = await prisma.list.findUniqueOrThrow({ where: { id: landingListId } });
    expect(sprintAfter.sprintStart!.getTime() - sprintBefore.sprintStart!.getTime()).toBe(3 * DAY);
    expect(sprintAfter.sprintEnd!.getTime() - sprintBefore.sprintEnd!.getTime()).toBe(3 * DAY);
    const doneAfter = await prisma.task.findUniqueOrThrow({ where: { id: doneBefore.id } });
    const doneShift = doneAfter.completedAt!.getTime() - doneBefore.completedAt!.getTime();
    expect(doneShift).toBeGreaterThan(3 * DAY - 60_000);
    expect(doneShift).toBeLessThan(3 * DAY + 60_000);
    const goalAfter = await prisma.goal.findUniqueOrThrow({ where: { id: goalBefore.id } });
    expect(goalAfter.dueDate!.getTime() - goalBefore.dueDate!.getTime()).toBe(3 * DAY);
    const attachmentAfter = await prisma.attachment.findUniqueOrThrow({ where: { id: attachmentBefore.id } });
    const attachmentShift = attachmentAfter.createdAt.getTime() - attachmentBefore.createdAt.getTime();
    expect(attachmentShift).toBeGreaterThan(3 * DAY - 60_000);
    expect(attachmentShift).toBeLessThan(3 * DAY + 60_000);
    const templateAfter = await prisma.taskTemplate.findUniqueOrThrow({ where: { id: templateBefore.id } });
    const templateShift = templateAfter.createdAt.getTime() - templateBefore.createdAt.getTime();
    expect(templateShift).toBeGreaterThan(3 * DAY - 60_000);
    expect(templateShift).toBeLessThan(3 * DAY + 60_000);
    const formAfter = await prisma.form.findUniqueOrThrow({ where: { id: formBefore.id } });
    const formShift = formAfter.lastSubmittedAt!.getTime() - formBefore.lastSubmittedAt!.getTime();
    expect(formShift).toBeGreaterThan(3 * DAY - 60_000);
    expect(formShift).toBeLessThan(3 * DAY + 60_000);
    // Date custom fields are calendar days: they move by whole days, other values stay.
    const dateValueAfter = await prisma.customFieldValue.findUniqueOrThrow({
      where: { taskId_fieldId: { taskId: dateValueBefore.taskId, fieldId: dateValueBefore.fieldId } },
    });
    const dayOf = (v: unknown) => Date.parse(`${v as string}T12:00:00Z`);
    expect(dayOf(dateValueAfter.value) - dayOf(dateValueBefore.value)).toBe(3 * DAY);
    const textValueAfter = await prisma.customFieldValue.findUniqueOrThrow({
      where: { taskId_fieldId: { taskId: textValueBefore.taskId, fieldId: textValueBefore.fieldId } },
    });
    expect(textValueAfter.value).toEqual(textValueBefore.value);
    // Chat messages and read markers keep their distance to "now", so unread badges stay the same.
    const chatAfter = await prisma.chatMessage.findUniqueOrThrow({ where: { id: chatBefore.id } });
    const chatShift = chatAfter.createdAt.getTime() - chatBefore.createdAt.getTime();
    expect(chatShift).toBeGreaterThan(3 * DAY - 60_000);
    expect(chatShift).toBeLessThan(3 * DAY + 60_000);
    const readAfter = await prisma.chatChannelRead.findUniqueOrThrow({
      where: { channelId_userId: { channelId: readBefore.channelId, userId: user.id } },
    });
    expect(readAfter.lastReadAt.getTime() - readBefore.lastReadAt.getTime()).toBe(chatShift);
    const shareAfter = await prisma.shareLink.findUniqueOrThrow({ where: { id: shareBefore.id } });
    expect(shareAfter.lastViewedAt!.getTime() - shareBefore.lastViewedAt!.getTime()).toBe(chatShift);
  });

  it("refills the pool up to the target size", async () => {
    expect(await refillGuestPool(2)).toBe(2);
    expect(await refillGuestPool(2)).toBe(0);
    expect(await countPooledGuests()).toBe(2);
  });
});
