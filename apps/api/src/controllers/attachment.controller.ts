import type { Request, Response } from "express";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { BadRequestError } from "../lib/errors/index.js";
import * as service from "../services/attachment.service.js";

type IdParams = { id: string };

export const listAttachments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res.status(200).json(await service.listAttachments(req.userId, id));
});

function decodeHeader(value: string | undefined) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    throw new BadRequestError("Invalid file name");
  }
}

/** Raw body upload: the file name and real content type travel in `x-file-name` / `x-file-type`. */
export const uploadAttachment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  if (!Buffer.isBuffer(req.body))
    throw new BadRequestError("Send the file as an application/octet-stream body");
  const attachment = await service.uploadAttachment(req.userId, id, {
    fileName: decodeHeader(req.get("x-file-name")),
    contentType: decodeHeader(req.get("x-file-type")).slice(0, 255),
    body: req.body,
  });
  res.status(201).json(attachment);
});

export const deleteAttachment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  await service.deleteAttachment(req.userId, id);
  res.status(204).send();
});
