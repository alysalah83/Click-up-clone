import type { Request, Response } from "express";
import type { CreateInviteInput, UpdateMemberRoleInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import * as memberService from "../services/member.service.js";

type MemberParams = { id: string; userId: string };

export const getWorkspaceMembers = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(200).json(await memberService.listWorkspaceMembers(req.userId, id));
});

export const getPeople = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await memberService.listPeople(req.userId));
});

export const updateMemberRole = catchAsync(async (req: Request, res: Response) => {
  const { id, userId } = req.params as MemberParams;
  res
    .status(200)
    .json(await memberService.updateMemberRole(req.userId, id, userId, req.body as UpdateMemberRoleInput));
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const { id, userId } = req.params as MemberParams;
  await memberService.removeMember(req.userId, id, userId);
  res.status(204).send();
});

export const createInvite = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  res.status(201).json(await memberService.createInvite(req.userId, id, req.body as CreateInviteInput));
});

export const previewInvite = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };
  res.status(200).json(await memberService.previewInvite(token));
});

export const acceptInvite = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params as { token: string };
  res.status(200).json(await memberService.acceptInvite(req.userId, token));
});
