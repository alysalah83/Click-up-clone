import type { CreateSavedViewInput, UpdateSavedViewInput } from "@clickup/shared";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors/index.js";
import { assertCanAccess } from "./access.service.js";

const view = { id: true, listId: true, name: true, config: true, isDefault: true, createdAt: true };

/** Saved views are private to their creator; access to the list is still membership-checked. */
export async function listSavedViews(userId: string, listId: string) {
  await assertCanAccess(userId, { listId });
  return prisma.savedView.findMany({ where: { listId, userId }, select: view, orderBy: { createdAt: "asc" } });
}

export async function createSavedView(userId: string, input: CreateSavedViewInput) {
  await assertCanAccess(userId, { listId: input.listId });
  const { listId, name, config, isDefault } = input;
  return prisma.$transaction(async (tx) => {
    if (isDefault) await tx.savedView.updateMany({ where: { listId, userId }, data: { isDefault: false } });
    return tx.savedView.create({ data: { listId, userId, name, config, isDefault: !!isDefault }, select: view });
  });
}

async function ownView(userId: string, id: string) {
  const found = await prisma.savedView.findFirst({ where: { id, userId }, select: { listId: true } });
  if (!found) throw new NotFoundError("Saved view not found");
  // The user may have left the workspace since.
  await assertCanAccess(userId, { listId: found.listId });
  return found;
}

export async function updateSavedView(userId: string, id: string, input: UpdateSavedViewInput) {
  const { listId } = await ownView(userId, id);
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.savedView.updateMany({ where: { listId, userId, id: { not: id } }, data: { isDefault: false } });
    }
    return tx.savedView.update({ where: { id }, data: input, select: view });
  });
}

export async function deleteSavedView(userId: string, id: string) {
  await ownView(userId, id);
  await prisma.savedView.delete({ where: { id } });
  return { id };
}
