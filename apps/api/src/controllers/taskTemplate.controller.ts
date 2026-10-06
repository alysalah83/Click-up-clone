import type { Request, Response } from "express";
import type { ApplyTaskTemplateInput, SaveTaskAsTemplateInput, UpdateTaskTemplateInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/taskTemplate.service.js";

export const getTemplates = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.query as { workspaceId?: string };
  res.status(200).json(await service.listTemplates(req.userId, workspaceId));
});

export const saveTaskAsTemplate = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.saveTaskAsTemplate(req.userId, req.body as SaveTaskAsTemplateInput));
});

export const updateTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.updateTemplate(req.userId, id, req.body as UpdateTaskTemplateInput));
});

export const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.deleteTemplate(req.userId, id));
});

export const applyTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(201).json(await service.applyTemplate(req.userId, id, req.body as ApplyTaskTemplateInput));
});
