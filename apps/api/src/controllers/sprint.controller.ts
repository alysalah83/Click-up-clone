import type { Request, Response } from "express";
import type { CreateSprintInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/sprint.service.js";

export const createSprint = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.body as CreateSprintInput;
  res.status(201).json(await service.createSprint(req.userId, workspaceId));
});

export const getSprint = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await service.getSprint(req.userId, listId));
});

export const getSprintReport = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await service.sprintReport(req.userId, listId));
});

export const completeSprint = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await service.completeSprint(req.userId, listId));
});
