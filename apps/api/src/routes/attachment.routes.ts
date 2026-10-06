import express, { type NextFunction, type Request, type Response } from "express";
import { MAX_ATTACHMENT_BYTES, formatFileSize, idParamsSchema } from "@clickup/shared";
import * as c from "../controllers/attachment.controller.js";
import { authMiddleware } from "../lib/middlewares/auth.middleware.js";
import { validate } from "../lib/middlewares/validate.middleware.js";
import { AppError } from "../lib/errors/appError.js";

const id = validate({ params: idParamsSchema });

/** Parses the raw file body (this route only); an oversized body gets a friendly 413. */
const rawFile = [
  express.raw({ type: "application/octet-stream", limit: MAX_ATTACHMENT_BYTES + 64 * 1024 }),
  (error: unknown, _req: Request, _res: Response, next: NextFunction) => {
    const tooLarge = typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large";
    next(tooLarge ? new AppError(`Files can be at most ${formatFileSize(MAX_ATTACHMENT_BYTES)}`, 413) : error);
  },
];

/** Mounted on /api/tasks: GET|POST /:id/attachments. */
export const taskAttachmentsRouter = express.Router();
taskAttachmentsRouter.use(authMiddleware);
taskAttachmentsRouter.get("/:id/attachments", id, c.listAttachments);
taskAttachmentsRouter.post("/:id/attachments", id, ...rawFile, c.uploadAttachment);

/** /api/attachments */
export const attachmentsRouter = express.Router();
attachmentsRouter.use(authMiddleware);
attachmentsRouter.delete("/:id", id, c.deleteAttachment);
