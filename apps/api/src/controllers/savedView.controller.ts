import type { Request, Response } from "express";
import type { CreateSavedViewInput, UpdateSavedViewInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/savedView.service.js";

export const getSavedViews = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await service.listSavedViews(req.userId, listId));
});

export const createSavedView = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.createSavedView(req.userId, req.body as CreateSavedViewInput));
});

export const updateSavedView = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.updateSavedView(req.userId, id, req.body as UpdateSavedViewInput));
});

export const deleteSavedView = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.deleteSavedView(req.userId, id));
});
