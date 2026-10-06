import type { Request, Response } from "express";
import type { CreateWhiteboardInput, UpdateWhiteboardInput, WhiteboardTaskInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/whiteboard.service.js";

export const getWhiteboards = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.query as { workspaceId?: string };
  res.status(200).json(await service.listWhiteboards(req.userId, workspaceId));
});

export const getWhiteboard = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.getWhiteboard(req.userId, id));
});

export const createWhiteboard = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.createWhiteboard(req.userId, req.body as CreateWhiteboardInput));
});

export const updateWhiteboard = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.updateWhiteboard(req.userId, id, req.body as UpdateWhiteboardInput));
});

export const deleteWhiteboard = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.deleteWhiteboard(req.userId, id));
});

export const createTaskFromNote = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(201).json(await service.createTaskFromNote(req.userId, id, req.body as WhiteboardTaskInput));
});
