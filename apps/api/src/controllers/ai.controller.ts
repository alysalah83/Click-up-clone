import type { Request, Response } from "express";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/ai.service.js";

export const summarize = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.summarizeTask(req.userId, id));
});

export const suggestSubtasks = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.suggestSubtasks(req.userId, id));
});
