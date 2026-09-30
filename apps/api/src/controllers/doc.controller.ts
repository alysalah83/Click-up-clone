import type { Request, Response } from "express";
import type { CreateDocInput, UpdateDocInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/doc.service.js";

export const getDocs = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.query as { workspaceId?: string };
  res.status(200).json(await service.listDocs(req.userId, workspaceId));
});

export const getDoc = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.getDoc(req.userId, id));
});

export const createDoc = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.createDoc(req.userId, req.body as CreateDocInput));
});

export const updateDoc = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.updateDoc(req.userId, id, req.body as UpdateDocInput));
});

export const deleteDoc = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await service.deleteDoc(req.userId, id));
});
