import type { Request, Response } from "express";
import type { LoginInput, RegisterInput, UpdateMeInput } from "@clickup/shared";
import { catchAsync } from "../lib/utils/catchAsync.js";
import { generateToken, type UserRole } from "../lib/middlewares/auth.middleware.js";
import { COOKIES_OPTIONS } from "../consts/auth.const.js";
import * as userService from "../services/user.service.js";

function sendSession(res: Response, status: number, user: { id: string; role: UserRole }) {
  const token = generateToken(user.id, user.role);
  res.cookie("token", token, COOKIES_OPTIONS);
  // The web app's server reads the token from the body and sets its own cookie (spec §0.1).
  res.status(status).json({ user, token });
}

export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.registerUser(req.body as RegisterInput);
  sendSession(res, 201, user);
});

export const registerGuest = catchAsync(async (_req: Request, res: Response) => {
  const user = await userService.registerGuest();
  sendSession(res, 201, user);
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.verifyCredentials(req.body as LoginInput);
  sendSession(res, 200, user);
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await userService.getMe(req.userId));
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json(await userService.updateMe(req.userId, req.body as UpdateMeInput));
});
