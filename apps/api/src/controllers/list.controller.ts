import type { Request, Response } from "express";
import type { CreateListInput, UpdateListInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as listService from "../services/list.service.js";

export const createList = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await listService.createList(req.userId, req.body as CreateListInput));
});

export const getLists = catchAsync(async (req: Request, res: Response) => {
  if (req.query.count === "true") return res.status(200).json(await listService.countLists(req.userId));
  res.status(200).json(await listService.listLists(req.userId));
});

export const getList = catchAsync(async (req: Request, res: Response) => {
  const { listId } = req.params as { listId: string };
  res.status(200).json(await listService.getList(req.userId, listId));
});

export const getLatestList = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await listService.getLatestList(req.userId));
});

export const getListsByWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.params as { workspaceId: string };
  res.status(200).json(await listService.listWorkspaceLists(req.userId, workspaceId));
});

export const checkListOwnership = catchAsync(async (req: Request, res: Response) => {
  const { listId, workspaceId } = req.params as { listId: string; workspaceId: string };
  res.status(200).json(await listService.isListInWorkspace(req.userId, listId, workspaceId));
});

export const updateList = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await listService.updateList(req.userId, id, req.body as UpdateListInput));
});

export const deleteList = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await listService.deleteList(req.userId, id);
  res.status(200).json({ message: "List deleted successfully" });
});
