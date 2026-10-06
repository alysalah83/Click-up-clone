import { MAX_ATTACHMENT_BYTES, formatFileSize, safeFileName } from "@clickup/shared";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors/appError.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../lib/errors/index.js";
import { deleteBlobsBestEffort, getBlobStorage } from "../lib/blobStorage.js";
import { assertCanAccess, hasRole } from "./access.service.js";
import { logActivity } from "./activity.service.js";
import { assigneeUserSelect } from "./task.dto.js";

const attachmentSelect = {
  id: true,
  taskId: true,
  fileName: true,
  contentType: true,
  size: true,
  url: true,
  createdAt: true,
  uploader: { select: assigneeUserSelect },
} as const;

export class AttachmentsNotConfiguredError extends AppError {
  constructor() {
    super("Attachments are not configured on this server", 503);
  }
}

/** Oldest first, like ClickUp's attachment grid. */
export async function listAttachments(userId: string, taskId: string) {
  await assertCanAccess(userId, { taskId });
  return prisma.attachment.findMany({
    where: { taskId },
    select: attachmentSelect,
    orderBy: { createdAt: "asc" },
  });
}

export interface UploadInput {
  fileName: string;
  contentType: string;
  body: Buffer;
}

export async function uploadAttachment(userId: string, taskId: string, { fileName, contentType, body }: UploadInput) {
  const { workspaceId } = await assertCanAccess(userId, { taskId }, "member");
  if (body.byteLength === 0) throw new BadRequestError("The file is empty");
  if (body.byteLength > MAX_ATTACHMENT_BYTES)
    throw new AppError(`Files can be at most ${formatFileSize(MAX_ATTACHMENT_BYTES)}`, 413);
  const storage = getBlobStorage();
  if (!storage) throw new AttachmentsNotConfiguredError();

  const name = fileName.trim().slice(0, 200) || "file";
  const type = contentType || "application/octet-stream";
  const blob = await storage.put(`attachments/${workspaceId}/${taskId}/${safeFileName(name)}`, body, type);
  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      uploaderId: userId,
      fileName: name,
      contentType: type,
      size: body.byteLength,
      url: blob.url,
      pathname: blob.pathname,
    },
    select: attachmentSelect,
  });
  await logActivity([{ taskId, actorId: userId, type: "attachment_added", data: { name } }]);
  return attachment;
}

/** The uploader, or a workspace admin, can delete. The blob goes too (best effort). */
export async function deleteAttachment(userId: string, id: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    select: { taskId: true, uploaderId: true, url: true, pathname: true },
  });
  if (!attachment) throw new NotFoundError("Attachment not found");
  const { role } = await assertCanAccess(userId, { taskId: attachment.taskId }, "member");
  if (attachment.uploaderId !== userId && !hasRole(role, "admin"))
    throw new ForbiddenError("You can only delete your own attachments");
  await prisma.attachment.delete({ where: { id } });
  if (attachment.pathname) await deleteBlobsBestEffort([attachment.url]);
}

/**
 * URLs of the blobs on the store among the matching attachments, read before rows cascade away.
 * Seeded demo files (empty pathname) point at public web assets and are skipped.
 */
export async function storedBlobUrls(where: Prisma.AttachmentWhereInput) {
  const rows = await prisma.attachment.findMany({
    where: { AND: [where, { pathname: { not: "" } }] },
    select: { url: true },
  });
  return rows.map((r) => r.url);
}
