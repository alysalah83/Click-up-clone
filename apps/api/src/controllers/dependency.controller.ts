import type { Request, Response } from "express";
import type { TaskDependencyInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/dependency.service.js";

export const listDependencies = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.query as { listId: string };
  res.status(200).json(await service.listDependencies(req.userId, listId));
});

export const addDependency = catchAsync(async (req: Request, res: Response) => {
  const { taskId, dependsOnId } = req.body as TaskDependencyInput;
  res.status(201).json(await service.addDependency(req.userId, taskId, dependsOnId));
});

export const removeDependency = catchAsync(async (req: Request, res: Response) => {
  const { taskId, dependsOnId } = req.params as TaskDependencyInput;
  await service.removeDependency(req.userId, taskId, dependsOnId);
  res.status(204).send();
});
