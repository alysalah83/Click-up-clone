import type { Request, Response } from "express";
import type { CreateStatusInput, UpdateStatusInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as statusService from "../services/status.service.js";

export const createStatus = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await statusService.createStatus(req.userId, req.body as CreateStatusInput));
});

export const getStatuses = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await statusService.listStatuses(req.userId, listId));
});

export const getStatusTasksCount = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await statusService.taskCountsByStatusName(req.userId));
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await statusService.updateStatus(req.userId, id, req.body as UpdateStatusInput));
});

export const deleteStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await statusService.deleteStatus(req.userId, id));
});
