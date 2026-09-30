import type { Request, Response } from "express";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/home.service.js";

export const myWork = catchAsync(async (req: Request, res: Response) => {
  const { tz } = req.query as { tz?: number };
  res.status(200).json(await service.myWork(req.userId, tz));
});

export const search = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query as { q: string };
  res.status(200).json(await service.search(req.userId, q));
});
