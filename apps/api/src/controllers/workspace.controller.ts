import type { Request, Response } from "express";
import type {
  CreateWorkspaceFlowInput,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as workspaceService from "../services/workspace.service.js";

type IdParams = { id: string };

export const createWorkspace = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await workspaceService.createWorkspace(req.userId, req.body as CreateWorkspaceInput));
});

export const createWorkspaceFlow = catchAsync(async (req: Request, res: Response) => {
  res
    .status(201)
    .json(await workspaceService.createWorkspaceFlow(req.userId, req.body as CreateWorkspaceFlowInput));
});

export const getWorkspaces = catchAsync(async (req: Request, res: Response) => {
  if (req.query.count === "true")
    return res.status(200).json(await workspaceService.countWorkspaces(req.userId));
  res.status(200).json(await workspaceService.listWorkspaces(req.userId));
});

export const getWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res.status(200).json(await workspaceService.getWorkspace(req.userId, id));
});

export const updateWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  res
    .status(200)
    .json(await workspaceService.updateWorkspace(req.userId, id, req.body as UpdateWorkspaceInput));
});

export const deleteWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as IdParams;
  await workspaceService.deleteWorkspace(req.userId, id);
  res.status(204).send();
});
