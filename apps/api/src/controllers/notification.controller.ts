import type { Request, Response } from "express";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/notification.service.js";

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.listNotifications(req.userId));
});

export const unreadCount = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.unreadCount(req.userId));
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.markRead(req.userId, id));
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.markAllRead(req.userId));
});
