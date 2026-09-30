import type { Request, Response } from "express";
import type { CreateManualTimeEntryInput, StartTimerInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/timeEntry.service.js";

export const listTimeEntries = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.query as { taskId: string };
  res.status(200).json(await service.getTaskTime(req.userId, taskId));
});

export const start = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.body as StartTimerInput;
  res.status(201).json(await service.startTimer(req.userId, taskId));
});

export const stop = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.stopTimer(req.userId, id));
});

export const addManual = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.addManualEntry(req.userId, req.body as CreateManualTimeEntryInput));
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await service.deleteEntry(req.userId, id);
  res.status(204).send();
});
