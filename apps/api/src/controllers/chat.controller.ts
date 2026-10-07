import type { Request, Response } from "express";
import type {
  ChatMessagesQuery,
  ChatTaskInput,
  CreateChatChannelInput,
  CreateChatMessageInput,
  UpdateChatChannelInput,
} from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as service from "../services/chat.service.js";

const id = (req: Request) => (req.params as { id: string }).id;

export const listChannels = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId } = req.query as { workspaceId?: string };
  res.status(200).json(await service.listChannels(req.userId, workspaceId));
});

export const getChannel = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.getChannel(req.userId, id(req)));
});

export const createChannel = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.createChannel(req.userId, req.body as CreateChatChannelInput));
});

export const updateChannel = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.updateChannel(req.userId, id(req), req.body as UpdateChatChannelInput));
});

export const deleteChannel = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.deleteChannel(req.userId, id(req)));
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.markRead(req.userId, id(req)));
});

export const listMessages = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.listMessages(req.userId, id(req), req.query as ChatMessagesQuery));
});

export const postMessage = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.postMessage(req.userId, id(req), req.body as CreateChatMessageInput));
});

export const listReplies = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.listReplies(req.userId, id(req)));
});

export const editMessage = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.editMessage(req.userId, id(req), (req.body as { body: string }).body));
});

export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.deleteMessage(req.userId, id(req)));
});

export const toggleReaction = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await service.toggleReaction(req.userId, id(req), (req.body as { emoji: string }).emoji));
});

export const createTask = catchAsync(async (req: Request, res: Response) => {
  res.status(201).json(await service.createTaskFromMessage(req.userId, id(req), req.body as ChatTaskInput));
});
