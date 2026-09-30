import type { Request, Response } from "express";
import type { CreateCommentInput, ToggleReactionInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/comment.service.js";

type IdParams = { id: string };

export const listComments = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res.status(200).json(await service.listComments(req.userId, id));
});

export const createComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res.status(201).json(await service.createComment(req.userId, id, req.body as CreateCommentInput));
});

export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  await service.deleteComment(req.userId, id);
  res.status(204).send();
});

export const toggleReaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  const { emoji } = req.body as ToggleReactionInput;
  res.status(200).json(await service.toggleReaction(req.userId, id, emoji));
});
