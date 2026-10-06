import type { Request, Response } from "express";
import type { CreateGoalInput, CreateGoalTargetInput, UpdateGoalInput, UpdateGoalTargetInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/goal.service.js";

type TargetParams = { id: string; targetId: string };

export const getGoals = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.query as { workspaceId?: string };
  res.status(200).json(await service.listGoals(req.userId, workspaceId));
});

export const getGoal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.getGoal(req.userId, id));
});

export const createGoal = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.createGoal(req.userId, req.body as CreateGoalInput));
});

export const updateGoal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.updateGoal(req.userId, id, req.body as UpdateGoalInput));
});

export const deleteGoal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.deleteGoal(req.userId, id));
});

export const createTarget = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(201).json(await service.createTarget(req.userId, id, req.body as CreateGoalTargetInput));
});

export const updateTarget = catchAsync(async (req: Request, res: Response) => {
  const { id, targetId } = req.params as TargetParams;
  res.status(200).json(await service.updateTarget(req.userId, id, targetId, req.body as UpdateGoalTargetInput));
});

export const deleteTarget = catchAsync(async (req: Request, res: Response) => {
  const { id, targetId } = req.params as TargetParams;
  res.status(200).json(await service.deleteTarget(req.userId, id, targetId));
});

export const linkTasks = catchAsync(async (req: Request, res: Response) => {
  const { id, targetId } = req.params as TargetParams;
  const { taskIds } = req.body as { taskIds: string[] };
  res.status(200).json(await service.linkTasks(req.userId, id, targetId, taskIds));
});

export const unlinkTask = catchAsync(async (req: Request, res: Response) => {
  const { id, targetId, taskId } = req.params as TargetParams & { taskId: string };
  res.status(200).json(await service.unlinkTask(req.userId, id, targetId, taskId));
});

export const getTaskGoals = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.goalsForTask(req.userId, id));
});
